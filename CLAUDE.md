# eVuka REWARDS App - Claude Instructions

## Project Overview

**eVuka REWARDS** is a production-ready gamified rewards platform that allows users to earn points by capturing and submitting receipts. Users can redeem points for rewards in the marketplace.

### Technology Stack

**Frontend:**
- React 18.2.0 with TypeScript 5.2.2
- Vite 7.3.1 (build tool)
- Tailwind CSS 3.4.1 + Radix UI (60+ components)
- React Router 6.23.1
- Framer Motion 11.18.0 (animations)

**Backend & Database:**
- Supabase 2.45.6 (PostgreSQL + Auth + Storage)
- Socket.io 4.8.1 (real-time features)
- Supabase Edge Functions (serverless)

**Key Libraries:**
- Tesseract.js 6.0.0 (OCR for receipt text extraction)
- browser-image-compression 2.0.2 (image optimization)
- @zxing/library 0.21.3 (QR code scanning)
- Anthropic AI SDK 0.74.0 (AI analysis)
- OpenAI SDK 4.85.4 (ChatGPT integration)

**Testing:**
- Jest 29.7.0 (unit/integration tests)
- React Testing Library 16.3.0
- Playwright 1.58.2 (E2E tests)
- Current Coverage: ~70% target, need to reach 80%+

**Mobile:**
- Capacitor (iOS/Android deployment)
- PWA with service worker and offline support

## Project Structure

```
eVuka-REWARDS-app/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication flows
│   │   ├── receipt-capture/  # Core receipt submission
│   │   ├── gamification/ # Points, achievements, streaks
│   │   ├── rewards/      # Rewards marketplace
│   │   ├── social/       # Leaderboard, referrals
│   │   ├── analytics/    # Price trends, dashboards
│   │   ├── shopping/     # Shopping lists
│   │   ├── settings/     # User preferences
│   │   └── ui/           # Reusable UI components (60+)
│   ├── lib/              # Business logic (31 files)
│   ├── pages/            # Page-level routing
│   ├── providers/        # React context providers
│   ├── types/            # TypeScript definitions
│   ├── hooks/            # Custom React hooks
│   └── tests/            # E2E and integration tests
├── supabase/             # Database migrations and config
├── public/               # Static assets
├── e2e/                  # Playwright E2E tests
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Current State (As of 2026-02-12)

### ✅ Completed
- Well-organized component architecture
- Comprehensive security measures (CSP, XSS protection, CSRF, encryption)
- Basic error handling and logging
- PWA support with offline functionality
- CI/CD pipeline (GitHub Actions + Netlify)
- Basic test coverage (~70% of critical paths)
- Supabase RLS policies for data security
- Multi-method receipt capture (camera, QR, manual, AR)

### ⚠️ In Progress / Needs Improvement
1. **Test Coverage**: Currently ~7% overall, target is 80%+
2. **Error Tracking**: No centralized tracking (need Sentry integration)
3. **Monitoring**: Basic monitoring, needs full observability stack
4. **Backend Services**: OCR runs client-side (performance bottleneck)

### ❌ Missing for Production
1. **Docker Containerization** - No Dockerfile or docker-compose
2. **Disaster Recovery Documentation** - No DR plan or backup procedures
3. **Server-Side Rate Limiting** - Only client-side (bypassable)
4. **Automated Key Rotation** - Manual process only
5. **Load Testing** - No performance benchmarks
6. **Accessibility Testing** - No a11y compliance verification
7. **API Documentation** - No OpenAPI/Swagger docs

## Production Readiness Roadmap

### CRITICAL PRIORITIES (Complete Before Production Launch)

#### 1. Backend OCR Service Implementation
**Status**: ❌ Not Started
**Priority**: 🔴 CRITICAL
**Timeline**: Week 1-2
**Files to Create**:
- `supabase/functions/ocr-processing/index.ts`
- `supabase/functions/ocr-processing/ocr-service.ts`
- `supabase/functions/ocr-processing/image-preprocessor.ts`

**Why Critical**: Current client-side OCR is slow on mobile devices and wastes user bandwidth. Server-side processing will improve UX significantly.

**Implementation**: Create Supabase Edge Function that:
- Accepts base64 image via POST
- Preprocesses image (enhance contrast, deskew, denoise)
- Runs Tesseract OCR with optimized parameters
- Caches results in Redis (24-hour TTL)
- Returns structured receipt data (items, total, date, store)
- Rate limiting: 100 requests/hour per user

**Testing**: Process 100 real receipt images, verify >90% accuracy for totals

#### 2. Centralized Error Tracking (Sentry)
**Status**: ❌ Not Started
**Priority**: 🔴 CRITICAL
**Timeline**: Week 3
**Files to Create**:
- `src/lib/sentry.ts`
- `src/lib/error-reporting.ts`
- `docs/MONITORING.md`

**Why Critical**: No visibility into production errors. Need to detect and fix issues before users report them.

**Implementation**:
- Install `@sentry/react` and `@sentry/vite-plugin`
- Initialize in `src/main.tsx`
- Add source map upload to CI/CD
- Configure alerts for critical errors
- Set up session replay for debugging

**Testing**: Trigger test errors and verify they appear in Sentry dashboard

#### 3. Docker Containerization
**Status**: ❌ Not Started
**Priority**: 🔴 CRITICAL
**Timeline**: Week 1-2
**Files to Create**:
- `Dockerfile` (production)
- `Dockerfile.dev` (development with hot reload)
- `docker-compose.yml`
- `nginx.conf`
- `docs/DOCKER.md`

**Why Critical**: Need consistent environments across development, testing, and production.

**Implementation**:
- Multi-stage build (builder + nginx)
- Alpine base images for minimal size (<50MB target)
- Configure nginx for SPA routing
- Add security headers
- Set up CI/CD to build and push images

**Testing**: Build and run locally, verify all features work in container

#### 4. Disaster Recovery Documentation
**Status**: ❌ Not Started
**Priority**: 🔴 CRITICAL
**Timeline**: Week 5-6
**Files to Create**:
- `docs/DISASTER_RECOVERY.md`
- `docs/BACKUP_STRATEGY.md`
- `scripts/backup-database.sh`
- `scripts/restore-database.sh`
- `scripts/verify-backup.sh`

**Why Critical**: No documented recovery procedures. Risk of data loss without tested backups.

**Implementation**:
- Document Supabase backup schedule
- Create automated backup scripts (daily to S3)
- Set up backup verification
- Define RTO (Recovery Time Objective): <1 hour
- Define RPO (Recovery Point Objective): <5 minutes
- Schedule monthly DR drills

**Testing**: Restore backup to staging environment monthly

#### 5. Production Monitoring Setup
**Status**: ⚠️ Partial (basic monitoring exists)
**Priority**: 🔴 CRITICAL
**Timeline**: Week 7-8
**Files to Create**:
- `monitoring/grafana/dashboards/application-metrics.json`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/alertmanager/config.yml`
- `src/lib/metrics.ts`
- `src/lib/rum.ts`
- `docs/MONITORING_GUIDE.md`

**Why Critical**: Need to detect performance degradation and outages before users are affected.

**Implementation**:
- Set up Grafana + Prometheus + Loki stack
- Create dashboards for:
  - Application metrics (request rate, error rate, response time)
  - Business metrics (DAU, receipts processed, points awarded)
  - Infrastructure metrics (CPU, memory, disk)
  - User experience metrics (Web Vitals: LCP, FID, CLS)
- Configure alerts for critical thresholds
- Implement Real User Monitoring (RUM)

**Testing**: Generate test metrics and verify dashboards update

#### 6. Security Hardening
**Status**: ⚠️ Partial (client-side only)
**Priority**: 🔴 CRITICAL
**Timeline**: Week 3-4
**Files to Create**:
- `supabase/functions/rate-limiter/index.ts`
- `supabase/functions/key-rotation/index.ts`
- `scripts/security-audit.sh`
- `scripts/rotate-keys.sh`
- `docs/SECURITY.md`

**Why Critical**: Client-side rate limiting can be bypassed. Need server-side protection.

**Implementation**:
- Implement server-side rate limiting (Redis-based)
- Set up automated key rotation (every 180 days)
- Add account lockout after 5 failed login attempts
- Implement CAPTCHA after 3 failed attempts
- Add security audit logging
- Run vulnerability scans (Snyk, OWASP ZAP)

**Testing**: Attempt to bypass rate limits, verify server blocks requests

### MEDIUM PRIORITIES (Complete Within 3 Months)

#### 7. Increase Test Coverage to 80%+
**Status**: ⚠️ ~7% overall coverage
**Priority**: 🟡 MEDIUM
**Timeline**: Ongoing (Weeks 9-14)
**Target Coverage by Module**:
- Critical paths (auth, receipt processing): 95%+
- High priority (gamification, offline sync): 85%+
- Medium priority (UI with business logic): 75%+
- Lower priority (pure UI components): 60%+

**Implementation**:
- Create `src/test-utils/` with test helpers
- Write unit tests for all `/src/lib/` modules
- Write component tests for critical user flows
- Write integration tests for E2E workflows
- Add coverage badges to README
- Enforce coverage thresholds in CI

#### 8. Add Accessibility Testing
**Status**: ❌ No a11y testing
**Priority**: 🟡 MEDIUM
**Timeline**: Weeks 11-12
**Target**: WCAG 2.1 Level AA compliance

**Implementation**:
- Install `@axe-core/react` and `jest-axe`
- Add `eslint-plugin-jsx-a11y` to ESLint
- Test all pages with axe-core (0 violations target)
- Ensure keyboard navigation works everywhere
- Add ARIA labels and roles
- Verify color contrast (4.5:1 minimum)
- Test with screen readers (NVDA, JAWS, VoiceOver)

#### 9-15. Additional Items
See full implementation plan in docs for:
- Performance Monitoring (Lighthouse CI, RUM)
- API Documentation (OpenAPI/Swagger)
- Configuration Management (netlify.toml)
- WebSocket Server Documentation
- Visual Regression Testing
- Load Testing and Scalability
- GDPR Compliance Documentation

## Common Tasks

### Running Tests
```bash
# Unit and integration tests
npm test

# With coverage report
npm test -- --coverage

# Watch mode (during development)
npm test -- --watch

# E2E tests
npm run test:e2e

# E2E in UI mode (for debugging)
npm run test:e2e -- --ui
```

### Development
```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Database Operations
```bash
# Apply migrations
npx supabase db push

# Reset database (⚠️ destructive)
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop
```

### Deployment
```bash
# Deploy to Netlify (via CI/CD)
git push origin main

# Manual deploy
netlify deploy --prod

# Preview deploy
netlify deploy
```

## Environment Variables

Required variables (see `.env.example`):

**Client-Safe (VITE_ prefix):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (RLS-protected)
- `VITE_WEBSOCKET_URL` - Real-time socket server URL
- `VITE_VAPID_PUBLIC_KEY` - Push notification public key
- `VITE_ENABLE_OCR` - Enable OCR feature (true/false)
- `VITE_ENABLE_PWA` - Enable PWA features (true/false)
- `VITE_ENABLE_OFFLINE` - Enable offline support (true/false)
- `VITE_DEBUG_LOGS` - Enable debug logging (true/false)
- `VITE_ENVIRONMENT` - Environment name (development/staging/production)

**Server-Only (NO VITE_ prefix):**
- `SUPABASE_SERVICE_KEY` - ⚠️ CRITICAL: Never expose to client
- `VAPID_PRIVATE_KEY` - Push notification private key
- `SUPABASE_PROJECT_ID` - For CLI operations

## Key Files and Their Purpose

### Critical Business Logic
- `src/lib/receipt-processing.ts` - Receipt OCR and data extraction (CRITICAL)
- `src/lib/gamification.ts` - Points calculation and achievements (CRITICAL)
- `src/lib/auth.ts` - Authentication wrapper (CRITICAL)
- `src/lib/security-enhanced.ts` - Security utilities (CRITICAL)
- `src/lib/offline-storage.ts` - Offline receipt storage (HIGH)

### Core Components
- `src/components/receipt-capture/CaptureInterface.tsx` - Main receipt capture UI
- `src/components/auth/LoginForm.tsx` - Authentication UI
- `src/components/gamification/GamificationHub.tsx` - Gamification dashboard
- `src/components/rewards/RewardsMarketplace.tsx` - Rewards redemption

### Configuration
- `vite.config.ts` - Build configuration and code splitting
- `jest.config.cjs` - Test configuration
- `playwright.config.ts` - E2E test configuration
- `capacitor.config.ts` - Mobile app configuration
- `supabase/config.toml` - Supabase local development

### CI/CD
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/deploy-preview.yml` - Preview deployments
- `DEPLOYMENT.md` - Deployment documentation

## Known Issues and Limitations

### Current Bugs
1. **Test Coverage Low**: Only ~7% overall coverage, many components untested
2. **Client-Side OCR Slow**: Tesseract.js runs in browser, slow on mobile
3. **No Error Tracking**: Errors only logged to console, no centralized tracking
4. **Rate Limiting Bypassable**: Client-side only, can be circumvented

### Performance Bottlenecks
1. **Large Bundle Size**: Initial JS bundle >300KB (target <300KB)
2. **OCR Processing**: Can take 10-30 seconds on low-end devices
3. **Image Upload**: Large images not compressed enough before upload

### Security Gaps
1. **No Server-Side Rate Limiting**: Need Redis-based distributed rate limiting
2. **Manual Key Rotation**: Should be automated every 180 days
3. **No Penetration Testing**: Need external security audit
4. **Client-Side Encryption Only**: Sensitive data encrypted client-side only

## Implementation Guidelines

### When Adding New Features
1. **Always write tests first** (TDD approach preferred)
   - Unit tests for business logic
   - Component tests for UI
   - Integration tests for workflows
   - E2E tests for critical user journeys

2. **Security checklist**:
   - Sanitize all user input
   - Validate data with Zod schemas
   - Use parameterized queries (never string concatenation)
   - Add rate limiting to new endpoints
   - Log security-relevant events

3. **Performance checklist**:
   - Lazy load components where possible
   - Optimize images (WebP format, compression)
   - Use React.memo for expensive components
   - Monitor bundle size impact

4. **Accessibility checklist**:
   - Add ARIA labels and roles
   - Ensure keyboard navigation works
   - Verify color contrast (4.5:1 minimum)
   - Test with screen reader
   - Add focus indicators

### Code Style
- Use TypeScript strict mode
- Follow Airbnb React style guide
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small (<200 lines)
- Extract business logic to `/src/lib/`
- Use descriptive variable names
- Add JSDoc comments for complex functions

### Git Workflow
- Branch naming: `feature/description` or `fix/description`
- Commit messages: Follow Conventional Commits
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for adding tests
  - `refactor:` for code refactoring
  - `perf:` for performance improvements
  - `chore:` for maintenance tasks
- Always include tests in PR
- Get code review before merging
- Squash commits on merge

## Useful Commands

### Testing Specific Files
```bash
# Test a specific file
npm test src/lib/receipt-processing.test.ts

# Test a specific describe block
npm test -t "calculatePoints"

# Run tests in watch mode for a file
npm test src/lib/receipt-processing.test.ts -- --watch
```

### Debugging
```bash
# Debug tests in VS Code
# Add breakpoint, then press F5 in VS Code

# Debug E2E tests
npm run test:e2e -- --debug

# View E2E test UI
npm run test:e2e -- --ui

# Generate E2E test code (record actions)
npx playwright codegen http://localhost:5173
```

### Database
```bash
# View database in browser
npx supabase start
# Then open: http://localhost:54323

# Create new migration
npx supabase migration new migration_name

# Squash migrations (before production)
npx supabase migration squash

# Backup database
npx supabase db dump > backup.sql

# Restore database
psql -h localhost -p 54322 -U postgres < backup.sql
```

## Next Steps for Production

### Immediate Actions (Week 1-2)
1. [ ] Implement backend OCR service
2. [ ] Set up Docker containers
3. [ ] Integrate Sentry error tracking
4. [ ] Create disaster recovery documentation

### Short-Term (Month 1-2)
5. [ ] Implement server-side rate limiting
6. [ ] Set up production monitoring (Grafana + Prometheus)
7. [ ] Automated key rotation
8. [ ] Increase test coverage to 60%

### Medium-Term (Month 3-4)
9. [ ] Add accessibility testing
10. [ ] Performance monitoring (Lighthouse CI)
11. [ ] API documentation (OpenAPI)
12. [ ] Increase test coverage to 80%

### Before Production Launch
- [ ] Run full security audit
- [ ] Conduct load testing (1000+ concurrent users)
- [ ] Test disaster recovery procedures
- [ ] Verify all CI/CD pipelines
- [ ] Review and update all documentation
- [ ] Train team on monitoring and incident response
- [ ] Set up on-call rotation
- [ ] Create post-launch monitoring checklist

## Support and Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)

### Internal Docs
- `DEPLOYMENT.md` - Deployment procedures
- `ios-build-instructions.md` - iOS build guide
- `android-build-instructions.md` - Android build guide
- `app-store-deployment-guide.md` - App store submission

### Getting Help
- Check existing tests for examples
- Review similar components in codebase
- Consult with team leads before major architectural changes
- Use TypeScript types to understand expected data structures

## Production Readiness Checklist

### Infrastructure
- [ ] Docker containerization complete
- [ ] CI/CD pipeline tested
- [ ] Staging environment set up
- [ ] Production environment set up
- [ ] CDN configured
- [ ] DNS configured
- [ ] SSL certificates installed

### Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection verified
- [ ] CSRF protection verified
- [ ] Security audit completed
- [ ] Penetration testing completed
- [ ] Vulnerability scanning automated

### Monitoring
- [ ] Error tracking active (Sentry)
- [ ] Performance monitoring active
- [ ] Log aggregation configured
- [ ] Dashboards created
- [ ] Alerts configured
- [ ] On-call rotation established
- [ ] Runbooks created

### Testing
- [ ] Unit test coverage >80%
- [ ] Integration test coverage >70%
- [ ] E2E test coverage >60%
- [ ] Accessibility tests passing
- [ ] Performance tests passing
- [ ] Load tests completed
- [ ] Visual regression tests active

### Documentation
- [ ] API documentation complete
- [ ] Deployment guide updated
- [ ] Disaster recovery plan documented
- [ ] Incident response plan created
- [ ] User documentation complete
- [ ] Developer onboarding guide complete

### Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance verified
- [ ] Data retention policy documented
- [ ] Cookie consent implemented (if needed)

---

**Last Updated**: 2026-02-12
**Version**: 1.0.0
**Status**: In Production Readiness Phase
**Next Review**: 2026-03-12
