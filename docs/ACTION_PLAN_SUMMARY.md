# Action Plan Summary - Quick Reference

## 🎯 Critical Issues to Fix (Do First)

### 1. Sidebar Scrollability (2 hours)
- **File:** `src/components/layout/AppLayout.tsx`
- **Fix:** Remove `overflow: "hidden"` or add explicit `maxHeight`
- **Test:** Verify scrolling works with many menu items

### 2. Pre-Approval for Employee/Management (4 hours)
- **File:** `src/pages/gatepass/CreateGatePass.tsx`
- **Fix:** Add role-based auto-approval logic
- **Backend:** Add support for role-based auto-approval
- **Test:** Employee/management passes auto-approve

### 3. Executive Pass Approval Routing (6 hours)
- **Files:** `src/pages/gatepass/CreateGatePass.tsx`, Backend approval endpoints
- **Fix:** Route executive-created passes to yard incharge
- **Backend:** Modify approval list to show exec passes to yard incharge
- **Test:** Yard incharge can see and approve exec passes

### 4. Role Definitions (1 hour) ✅ DONE
- **Status:** Fixed in latest pull
- **Verify:** All roles exist in both `users.ts` and `evaluator.ts`

---

## 📋 Phase Breakdown

### Phase 1: Critical Fixes (Week 1)
- Sidebar scrollability
- Pre-approval mechanism
- Approval routing
- Role verification

### Phase 2: Role System (Weeks 2-3)
- Database-backed roles
- Role management API
- Role management UI
- Permission system refactor

### Phase 3: Capability Matrix (Week 4)
- Role-level capabilities
- Capability templates
- UI improvements

### Phase 4: Workflow Enhancements (Week 5)
- Configurable workflows
- Enhanced approval queue

### Phase 5: Testing & Docs (Week 6)
- Comprehensive testing
- Documentation updates

---

## 🚀 Quick Start

1. **Start with Phase 1.1** (Sidebar) - Easiest win
2. **Then Phase 1.3** (Pre-approval) - High impact
3. **Then Phase 1.4** (Approval routing) - Solves exec pass issue
4. **Move to Phase 2** for long-term flexibility

---

## 📊 Estimated Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1 | 13 hours | 🔴 Critical |
| Phase 2 | 46 hours | 🟡 High |
| Phase 3 | 18 hours | 🟢 Medium |
| Phase 4 | 16 hours | 🔵 Medium |
| Phase 5 | 20 hours | 📚 High |
| **Total** | **113 hours** | ~3 weeks full-time |

---

## ⚠️ Key Risks

1. **Database migration** - Could break existing users
2. **Permission changes** - Could break existing checks
3. **Backward compatibility** - Need to maintain old system

---

## ✅ Success Criteria

- [ ] Sidebar scrolls properly
- [ ] Employee/management passes auto-approve
- [ ] Yard incharge can approve exec passes
- [ ] Roles can be created/modified via UI
- [ ] No breaking changes

---

**See full plan:** `docs/ACTION_PLAN_USER_MANAGEMENT_GATE_PASS.md`


