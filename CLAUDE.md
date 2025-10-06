# Claude AI Assistant Configuration

## Project Context
This is a **Code Quality Documentation Project** that creates comprehensive documentation aligned with industry best practices for software development lifecycle management.

## Project Structure
- **Theoretical Foundation**: Complete documentation covering requirements through deployment
- **Industry Alignment**: ISO 25010, IEEE 829, ISTQB, DORA metrics, OWASP, WCAG 2.1
- **Learning Path**: Progressive modules from foundations to continuous improvement
- **Practical Templates**: Ready-to-use templates for user stories, DoD, code reviews
- **Comprehensive Examples**: Production-ready examples for all testing approaches and CI/CD patterns

## Key Commands
- **Linting**: Check if project has specific linting setup (none configured yet)
- **Testing**: Check if project has test framework (none configured yet)
- **Build**: Check if project has build process (none configured yet)

## Documentation Standards
When working on this project:

1. **Follow IEEE 829** standards for test documentation
2. **Align with ISO 25010** for quality characteristics
3. **Use ISTQB** terminology for testing concepts
4. **Reference DORA metrics** for DevOps practices
5. **Include OWASP** security considerations
6. **Follow WCAG 2.1** for accessibility

## File Conventions
- All documentation uses `.md` format
- Each module has a `README.md` as entry point
- Templates in `/templates` directory
- Examples in `/examples` directory with complete implementations
- Resources in `/resources` directory
- Testing examples cover all levels: unit, integration, E2E, component, contract, manual, exploratory

## Quality Gates
- Documentation must be accurate against industry standards
- All content should be practical and actionable
- Cross-references between related topics required
- Examples must be realistic and immediately usable
- Testing examples must include comprehensive test suites demonstrating best practices
- All code examples should be production-ready with proper error handling and edge cases

## Maintenance Notes
- Review quarterly for industry standard updates
- Update metrics formulas as practices evolve
- Ensure all external references remain valid
- Keep alignment with latest DORA State of DevOps reports
- Update testing framework examples as new versions are released
- Ensure compatibility of example code with latest tool versions
- Add new testing approaches and patterns as they emerge in the industry

## Examples Directory Structure
```
examples/
├── unit-tests/              # Jest, Vitest, mutation testing examples
├── integration-tests/       # API, database integration patterns
├── e2e-tests/              # Cypress, Playwright automation suites
├── component-testing/       # React Testing Library, Vue Test Utils
├── contract-testing/        # Pact consumer/provider, OpenAPI validation
├── manual-testing/          # Test cases, checklists, test plans
├── exploratory-testing/     # Session charters, heuristics, reporting
├── version-control/         # TBD, GitHub Flow, GitLab Flow pipelines with feature flags
├── ci-pipelines/           # GitHub Actions, GitLab CI, Jenkins configs
└── monitoring-configs/     # Prometheus, Grafana, alerting setups
```

## Version Control & CI/CD Methodologies
This project now includes comprehensive documentation and examples for modern version control workflows optimized for CI/CD:

- **Trunk-Based Development (TBD)**: Recommended for continuous deployment
- **GitHub Flow**: Simple workflow for web applications
- **GitLab Flow**: Environment-based deployment progression
- **GitFlow**: Traditional workflow for scheduled releases

All examples include:
- Production-ready pipeline configurations
- Feature flags implementation
- Canary and blue-green deployment strategies
- Automated rollback procedures
- Security scanning integration