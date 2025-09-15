# Claude Context Engineering Resources

This directory contains specialized context and prompt engineering resources for the Intelligent Document Processing System project.

## Directory Structure

### `/prompts/`
Specialized system prompts and persona definitions:
- `system_architect.md` - Enterprise AI architect persona and guidelines
- `ai_ethics_reviewer.md` - Responsible AI and ethics review prompts
- `security_analyst.md` - Security-focused analysis and recommendations

### `/context/`
Project-specific context and knowledge base:
- `project_overview.md` - Complete project mission and goals
- `business_requirements.md` - Stakeholder needs and success criteria
- `technical_constraints.md` - Platform limitations and requirements

### `/rules/`
Development and architectural constraints:
- `development_standards.md` - Coding standards and best practices
- `security_requirements.md` - Security policies and implementation rules
- `compliance_framework.md` - Regulatory and governance requirements

### `/tools/`
Tool specifications and integration patterns:
- `mcp_agent_specs.md` - Model Context Protocol implementation details
- `aws_service_patterns.md` - AWS service integration guidelines
- `monitoring_dashboard.md` - Observability and metrics specifications

## Usage Guidelines

### For System Architecture Tasks
1. Load `prompts/system_architect.md` for architectural decision-making
2. Reference `context/project_overview.md` for business context
3. Apply `rules/development_standards.md` for implementation constraints

### For Security Reviews
1. Use `prompts/security_analyst.md` for security-focused analysis
2. Reference `rules/security_requirements.md` for compliance checks
3. Apply `tools/aws_service_patterns.md` for cloud security patterns

### For AI Ethics and Governance
1. Load `prompts/ai_ethics_reviewer.md` for bias and fairness analysis
2. Reference `rules/compliance_framework.md` for regulatory requirements
3. Consider `context/business_requirements.md` for stakeholder impact

## Context Engineering Best Practices

### Prompt Design
- Use specific, actionable instructions
- Include relevant examples and counterexamples
- Define clear success criteria and evaluation metrics
- Provide structured output formats when needed

### Context Management
- Keep context focused and relevant to the current task
- Use hierarchical context loading (general → specific)
- Regularly update context based on project evolution
- Version control context changes for repeatability

### Tool Integration
- Define clear interfaces between agents and tools
- Implement proper error handling and fallback mechanisms
- Monitor tool performance and usage patterns
- Maintain tool documentation and examples

## Dynamic Context Loading

This system supports dynamic context loading based on task requirements:

```typescript
interface ContextLoader {
  loadForTask(taskType: TaskType): Promise<ContextBundle>;
  loadForPersona(persona: PersonaType): Promise<PersonaBundle>;
  loadForDomain(domain: DomainType): Promise<DomainBundle>;
}
```

### Example Usage
```bash
# Load system architect context for infrastructure design
claude --context .claude/prompts/system_architect.md --task "design_infrastructure"

# Load security analyst context for threat modeling
claude --context .claude/prompts/security_analyst.md --task "security_review"

# Load combined context for comprehensive analysis
claude --context .claude/prompts/system_architect.md,.claude/rules/security_requirements.md
```

## Continuous Improvement

### Context Optimization
- Track context effectiveness through task completion rates
- A/B test different prompt formulations
- Gather feedback from team members on context quality
- Refine context based on actual usage patterns

### Knowledge Base Evolution
- Regular updates to reflect new architectural patterns
- Integration of lessons learned from production deployments
- Incorporation of industry best practices and standards
- Alignment with evolving regulatory requirements