/**
 * Comment Thread Component
 * 
 * Displays threaded comments for approvals, discussions, etc.
 * Supports @mentions, timestamps, and user avatars
 */

import React, { useState, useCallback } from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Button } from './button';
import { useAuth } from '../../providers/useAuth';
import { Send, AtSign, User } from 'lucide-react';

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_role?: string;
  content: string;
  created_at: string;
  mentions?: string[]; // User IDs mentioned in the comment
  parent_id?: string; // For threaded replies
}

export interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, mentions?: string[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  showMentions?: boolean;
  availableUsers?: Array<{ id: string; name: string; role?: string }>; // For @mention autocomplete
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  onAddComment,
  placeholder = 'Add a comment...',
  disabled = false,
  showMentions = true,
  availableUsers = [],
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Parse @mentions from comment text
  const parseMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = availableUsers.find(u => 
        u.name.toLowerCase().includes(username.toLowerCase()) ||
        u.id === username
      );
      if (user) {
        mentions.push(user.id);
      }
    }
    return [...new Set(mentions)]; // Remove duplicates
  }, [availableUsers]);

  // Handle @mention detection
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check if user is typing @mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space or newline after @ (meaning mention is complete)
      if (!textAfterAt.match(/[\s\n]/)) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionSuggestions(true);
        return;
      }
    }
    
    setShowMentionSuggestions(false);
    setNewComment(value);
  }, []);

  // Insert mention into comment
  const insertMention = useCallback((user: { id: string; name: string }) => {
    const beforeMention = newComment.substring(0, mentionStartIndex);
    const afterMention = newComment.substring(mentionStartIndex + mentionQuery.length + 1);
    const updatedComment = `${beforeMention}@${user.name} ${afterMention}`;
    setNewComment(updatedComment);
    setShowMentionSuggestions(false);
    setMentionQuery('');
  }, [newComment, mentionStartIndex, mentionQuery]);

  // Filter users for mention suggestions
  const mentionSuggestions = availableUsers.filter(u =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const mentions = parseMentions(newComment);
      await onAddComment(newComment.trim(), mentions);
      setNewComment('');
      setShowMentionSuggestions(false);
    } catch (error) {
      // Error handling should be done by parent
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, isSubmitting, onAddComment, parseMentions]);

  // Format comment content with @mentions highlighted
  const formatCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const mentionedUser = availableUsers.find(u => 
          u.name.toLowerCase() === username.toLowerCase() ||
          u.id === username
        );
        if (mentionedUser) {
          return (
            <span
              key={index}
              style={{
                color: colors.primary,
                fontWeight: 600,
                backgroundColor: colors.primary + '15',
                padding: '2px 4px',
                borderRadius: borderRadius.sm,
              }}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Group comments by parent (for threading)
  const rootComments = comments.filter(c => !c.parent_id);
  const repliesByParent = comments
    .filter(c => c.parent_id)
    .reduce((acc, reply) => {
      if (!acc[reply.parent_id!]) {
        acc[reply.parent_id!] = [];
      }
      acc[reply.parent_id!].push(reply);
      return acc;
    }, {} as Record<string, Comment[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Comments List */}
      {rootComments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {rootComments.map((comment) => {
            const replies = repliesByParent[comment.id] || [];
            const isCurrentUser = comment.author_id === user?.id;

            return (
              <div key={comment.id}>
                {/* Main Comment */}
                <div
                  style={{
                    padding: spacing.md,
                    backgroundColor: isCurrentUser ? colors.primary + '10' : colors.neutral[50],
                    borderRadius: borderRadius.md,
                    border: `1px solid ${isCurrentUser ? colors.primary + '30' : colors.neutral[200]}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.primary,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                        <span style={{ ...typography.body, fontWeight: 600, color: colors.neutral[900] }}>
                          {comment.author_name}
                        </span>
                        {comment.author_role && (
                          <span
                            style={{
                              ...typography.bodySmall,
                              color: colors.neutral[600],
                              backgroundColor: colors.neutral[100],
                              padding: '2px 6px',
                              borderRadius: borderRadius.sm,
                            }}
                          >
                            {comment.author_role}
                          </span>
                        )}
                        <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div style={{ ...typography.body, color: colors.neutral[700], lineHeight: 1.6 }}>
                        {formatCommentContent(comment.content)}
                      </div>
                      {comment.mentions && comment.mentions.length > 0 && showMentions && (
                        <div style={{ marginTop: spacing.xs, display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                          {comment.mentions.map((userId) => {
                            const mentionedUser = availableUsers.find(u => u.id === userId);
                            if (!mentionedUser) return null;
                            return (
                              <span
                                key={userId}
                                style={{
                                  ...typography.bodySmall,
                                  color: colors.primary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <AtSign size={12} />
                                {mentionedUser.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div style={{ marginLeft: spacing.xl, marginTop: spacing.sm, paddingLeft: spacing.md, borderLeft: `2px solid ${colors.neutral[200]}` }}>
                    {replies.map((reply) => {
                      const isCurrentUserReply = reply.author_id === user?.id;
                      return (
                        <div
                          key={reply.id}
                          style={{
                            padding: spacing.sm,
                            backgroundColor: isCurrentUserReply ? colors.primary + '08' : colors.neutral[50],
                            borderRadius: borderRadius.md,
                            marginBottom: spacing.xs,
                            border: `1px solid ${isCurrentUserReply ? colors.primary + '20' : colors.neutral[200]}`,
                          }}
                        >
                          <div style={{ display: 'flex', gap: spacing.sm }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: colors.primary,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              {reply.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                                <span style={{ ...typography.bodySmall, fontWeight: 600, color: colors.neutral[900] }}>
                                  {reply.author_name}
                                </span>
                                <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <div style={{ ...typography.bodySmall, color: colors.neutral[700], lineHeight: 1.5 }}>
                                {formatCommentContent(reply.content)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Form */}
      {!disabled && (
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={newComment}
              onChange={handleCommentChange}
              placeholder={placeholder}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                ...typography.body,
                fontFamily: 'inherit',
                minHeight: '80px',
                resize: 'vertical' as const,
              }}
            />
            
            {/* Mention Suggestions */}
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: spacing.xs,
                  backgroundColor: 'white',
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => insertMention(user)}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      ...typography.body,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <User size={16} color={colors.neutral[600]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: colors.neutral[900] }}>
                        {user.name}
                      </div>
                      {user.role && (
                        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                          {user.role}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.sm }}>
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || isSubmitting}
              icon={<Send size={16} />}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      )}

      {comments.length === 0 && !disabled && (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
          <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>💬</div>
          <div>No comments yet. Start the discussion!</div>
        </div>
      )}
    </div>
  );
};

