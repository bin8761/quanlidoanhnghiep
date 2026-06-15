# ADR-0001: Use AWS Amplify Hosting for frontend

**Date**: 2026-06-14
**Status**: accepted
**Deciders**: Codex, user

## Context

The frontend is a React SPA for the Enterprise Asset Management system. The team wants the frontend architecture to be simple, low-cost, and easy to operate while still meeting the six AWS Well-Architected pillars at an appropriate level for an early-stage deployment.

The main requirement is to avoid unnecessary infrastructure overhead. The frontend does not need application servers, load balancers, or databases. It primarily needs reliable static hosting, HTTPS, domain management, and a straightforward deployment path.

## Decision

We use **AWS Amplify Hosting** as the primary hosting platform for the frontend. We keep the frontend as a static web application, served with managed HTTPS and deployment workflows, and do not introduce `ALB`, `EC2`, `ECS`, or `RDS` for the frontend layer.

## Alternatives Considered

### Alternative 1: S3 private bucket + CloudFront
- **Pros**: Very cost-efficient, high control over caching and origin access, strong fit for static SPAs.
- **Cons**: Requires more setup and more manual ownership of delivery and deployment wiring.
- **Why not**: Rejected for now because the team prefers the simplest operational model for the frontend.

### Alternative 2: Self-managed application servers
- **Pros**: Full control over runtime and request handling.
- **Cons**: Higher cost, more maintenance, unnecessary for a static SPA.
- **Why not**: Rejected because the frontend does not need server-side compute.

### Alternative 3: AWS Amplify Hosting
- **Pros**: Lowest operational overhead, built-in CI/CD, HTTPS, custom domain support, and a clean fit for React SPA delivery.
- **Cons**: Less control than a fully custom CloudFront setup.
- **Why chosen**: Best balance of simplicity, cost, and maintainability for the current frontend scope.

## Consequences

### Positive
- Deployment is simpler and faster.
- There is no need to manage application servers or load balancers for the frontend.
- HTTPS and hosting workflows are handled by a managed service.

### Negative
- Less low-level control than a fully custom static hosting stack.
- Some future optimization options may require moving to a more customized delivery setup.

### Risks
- If frontend requirements grow significantly, the team may need to revisit the hosting model and consider a more customized static delivery architecture.

