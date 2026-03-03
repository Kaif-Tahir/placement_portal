# Contributing to CareerOS

Thank you for your interest in contributing to CareerOS! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Code** - Fix bugs, implement features, improve performance
- **Documentation** - Write guides, improve existing docs, add examples
- **Testing** - Report bugs, write tests, test new features
- **Design** - Improve UI/UX, suggest design improvements
- **Ideas** - Suggest features, report issues, provide feedback

---

## 🚀 Getting Started

### 1. Fork the Repository

```bash
# Visit https://github.com/yourusername/CareerOS
# Click "Fork" button
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CareerOS.git
cd CareerOS
```

### 2. Create a Feature Branch

```bash
# Create a new branch for your feature
git checkout -b feature/amazing-feature

# Or for bug fixes
git checkout -b fix/bug-description

# Or for documentation
git checkout -b docs/documentation-title
```

### 3. Make Your Changes

See section below for code guidelines.

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with clear message
git commit -m "Add: Brief description of changes"
# Or: "Fix: Brief description of fix"
# Or: "Docs: Brief description of documentation"
```

### 5. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 6. Create a Pull Request

- Visit your fork on GitHub
- Click "Compare & pull request"
- Fill in the PR template
- Submit for review

---

## 📋 Pull Request Guidelines

### PR Title Format

Use one of these prefixes:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code formatting (no logic changes)
- `refactor:` - Code restructuring (no logic changes)
- `test:` - Adding or updating tests
- `chore:` - Dependency updates, tooling

Example: `feat: Add job search filters`

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Breaking change

## Related Issue
Closes #(issue number)

## Testing
How to test these changes:
1. Step 1
2. Step 2
3. Step 3

## Screenshots (if applicable)
<!-- Paste screenshots here -->

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have updated documentation
- [ ] I have tested these changes locally
- [ ] No new warnings are generated
```

---

## 💻 Code Guidelines

### Frontend (React)

#### File Structure

```
src/
├── components/
│   ├── ComponentName.jsx
│   ├── ComponentName.module.css  (if needed)
│   └── index.js
├── pages/
│   └── PageName.jsx
└── hooks/
    └── useHookName.js
```

#### Naming Conventions

- **Components:** PascalCase (`StudentDashboard.jsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth()`)
- **Functions:** camelCase (`handleSubmit()`)
- **Constants:** UPPER_SNAKE_CASE (`COLLECTION_NAMES`)
- **Classes:** PascalCase (`UserService`)

#### Code Style

```javascript
// ✅ Good - Clear and readable
const StudentDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Component logic
  }, []);

  return (
    <div className="space-y-4">
      {/* JSX */}
    </div>
  );
};
```

```javascript
// ❌ Bad - Unclear
const SD = () => {
  const [s, setS] = useState([]);
  // ...
};
```

#### Component Guidelines

- Keep components small and focused (< 200 lines)
- Extract reusable logic into custom hooks
- Use destructuring for props
- Add PropTypes or TypeScript types
- Add comments for complex logic

#### Performance

- Use `React.memo()` for expensive components
- Use `useCallback()` for event handlers passed as props
- Use `useMemo()` for expensive computations
- Avoid unnecessary re-renders

### Backend (Cloud Functions)

#### Function Structure

```javascript
// ✅ Good structure
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Export with proper naming
exports.functionName = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    // Authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User not authenticated'
      );
    }

    try {
      // Main logic
      const result = await processData(data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'An error occurred'
      );
    }
  });
```

#### Best Practices

- Always validate input data
- Check user authentication/authorization
- Use proper error handling
- Add meaningful error messages
- Keep functions small and focused
- Use async/await over callbacks
- Add logging for debugging

### Database (Firestore)

#### Collection Naming

- Use lowercase, plural names: `users`, `jobs`, `applications`
- Use snake_case for sub-collections: `user_documents`

#### Document Structure

```javascript
// ✅ Good - Clear structure
{
  id: 'doc123', // Auto-generated by Firebase
  userId: 'user456',
  title: 'Software Engineer',
  description: 'Description here',
  status: 'active', // Use constants
  metadata: {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'user456'
  }
}
```

#### Indexing

- Create composite indexes for frequent queries
- Document indexes in `firestore.indexes.json`
- Always test queries locally first

---

## 🧪 Testing

### Frontend Testing

```bash
cd frontend
npm test
```

### Backend Testing

```bash
cd backend/functions
npm test
```

### Test Coverage Goals

- Aim for > 80% coverage
- Test critical paths thoroughly
- Test error cases
- Write integration tests

#### Test File Structure

```javascript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test code
  });

  it('should handle user interaction', () => {
    // Test code
  });

  it('should handle errors gracefully', () => {
    // Test code
  });
});
```

---

## 📝 Documentation Guidelines

### Markdown Formatting

- Use clear, concise language
- Add code examples where helpful
- Include links to related docs
- Use proper heading hierarchy (# → ## → ###)
- Add table of contents for long docs

### Code Comments

```javascript
// ✅ Good - Explains Why, not What
// Fetch eligible jobs based on user's CGPA threshold
// to avoid showing jobs with unmet requirements
const eligibleJobs = jobs.filter(job => 
  job.minCGPA <= user.cgpa
);

// ❌ Bad - States the obvious
// Filter jobs
const eligibleJobs = jobs.filter(job => 
  job.minCGPA <= user.cgpa
);
```

### JSDoc Comments

```javascript
/**
 * Fetches jobs eligible for a student
 * @param {string} studentId - The student's user ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.type - Job type (full-time, internship)
 * @returns {Promise<Array>} Array of eligible jobs
 * @throws {Error} If student not found
 */
async function getEligibleJobs(studentId, filters = {}) {
  // Implementation
}
```

---

## 🔐 Security Checklist

Before submitting a PR, verify:

- [ ] No sensitive data in code (API keys, passwords)
- [ ] No hardcoded credentials
- [ ] Input data is validated
- [ ] Authorization checks are in place
- [ ] SQL injection risks addressed (if applicable)
- [ ] XSS protection implemented
- [ ] No unnecessary permissions granted
- [ ] Error messages don't leak sensitive info

---

## 🐛 Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
<!-- If applicable -->

## Environment
- Browser: Chrome v120
- OS: macOS 14
- Node version: 18.x
- Firebase region: us-central1

## Additional Context
Any other relevant information
```

---

## ✨ Feature Request Template

```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Any alternative approaches?

## Additional Context
Mockups, links, examples, etc.
```

---

## 📚 Development Tools

### Recommended Extensions (VS Code)

- ESLint
- Prettier
- Firebase Extension
- Thunder Client (or Postman)
- Cloud Functions emulator

### Environment Setup

```bash
# Copy example env file
cp frontend/.env.example frontend/.env

# Install pre-commit hooks (optional)
npm install husky --save-dev
npx husky install
```

---

## 🚀 Performance Tips

### Frontend

- Use production builds for testing
- Use React DevTools Profiler
- Minimize bundle size with code splitting
- Use images in optimal formats (WebP)
- Lazy load heavy components

### Backend

- Monitor Cloud Function execution time
- Optimize Firestore queries with indexes
- Use batch operations for multiple writes
- Cache frequently accessed data
- Monitor costs in Firebase Console

---

## 📖 Documentation Structure

```
docs/
├── ARCHITECTURE.md          # System design
├── DATABASE_SCHEMA.md       # Data structure
├── API_DOCUMENTATION.md     # API reference
├── DEPLOYMENT_GUIDE.md      # Production guide
├── IMPLEMENTATION_PLAN.md   # Roadmap
└── CONTRIBUTING.md          # This file
```

---

## 🎯 Contributing to Documentation

1. Fix typos and improve clarity
2. Add missing code examples
3. Update outdated information
4. Add new guides for common tasks
5. Improve formatting and organization

```bash
# Preview docs locally (if needed)
npm install -g docsify-cli
docsify serve docs
```

---

## ⚖️ Code Review Process

### What Reviewers Look For

- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Security concerns
- Breaking changes

### Feedback Guidelines

- Respond to feedback promptly
- Ask for clarification if needed
- Make requested changes
- Push new commits to the same branch
- Don't force push (keeps history)

### Timeline

- Small PRs (< 100 lines): Reviewed within 2 days
- Medium PRs (100-500 lines): Reviewed within 5 days
- Large PRs (> 500 lines): May request breakdown

---

## ✅ Checklist Before Submitting PR

- [ ] Code follows style guidelines
- [ ] No console.log() statements left
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
- [ ] Tested all affected features
- [ ] No merge conflicts
- [ ] Commit messages are clear

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Firebase Guides](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Cloud Functions Best Practices](https://firebase.google.com/docs/functions/tips/best-practices)

---

## 💬 Communication

- **Issues:** Use GitHub Issues for bugs and features
- **Discussions:** Use GitHub Discussions for ideas
- **Email:** <support@careeros.com> for security issues
- **Code Review:** Comment directly on PR lines

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You

Your contributions make CareerOS better for everyone. We appreciate your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.
