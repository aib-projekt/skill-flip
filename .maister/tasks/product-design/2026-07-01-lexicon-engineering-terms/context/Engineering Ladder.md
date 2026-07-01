# JIT Team Human factor of IT

## IT Experience
- Regular: 2-5 years of experience in IT
- Senior: >5 years of experience in IT

## Skills
### Soft skills
- Communicativeness: Ability to convey information effectively, in a clear and understandable way
- High personal culture: High personal culture during an interview consists of the elements such as punctuality, treating the recruiter/coworkers with respect, taking care of a pleasant atmosphere of conversation, appropriate clothing and conditions in which the candidate is interviewed
- Professionalism: The candidate is characterized by a high standard of professional ethics, a sense of liability
- Willingness to grow and learn: Openness to constructive criticism, not only accepting it, but also identifying areas for improvement
- Building relationships: The candidate inspires the recruiter's/team trust through his authenticity and sincerity. Is transparent and has skills related to maintaining positive interpersonal relationships, actively listens

### Management

- Regular
    - Tasks Delegation: Ability to effectively delegate tasks to the other team
    - Project Management: Ability to manage projects and coordinate team activities
- Senior
    - Strategic Planning: Ability to plan long-term activities and team strategies
    - Process Optimization: Ability to analyze and optimize work process

### Mentoring

- Regular
    - Active Mentoring: Ability to mentor juniors and interns, helping them to develop their technical skills
- Senior
    - Advanced Mentoring: Ability to lead mentoring programs for the entire team, supporting the career developments of less experienced employees

### Problem Solving

- Regular
    - Complex Problems Solving: Ability to analyze and solve complex technical problems
    - Technical Writing: Proficiency in creating functional documentation both before and after implementation. Additionally, knowledge of various problem-solving methodologies and tools, such as flowcharts, SWOT Analysis, the 5 Whys, and diagrams, is a plus, along with the ability to apply them effectively.
- Senior
    - Advanced Data Analysis: Ability to conduct detailed data analysis and draw conclusions
    - Creative Approach: Ability to propose new solutions to common problems

## Technical skils
### API Development

- Junior
    - Understands and able to apply in practice:
        - HTTP/HTTPS protocols
        - Principles of client- server architecture
        - Basic use of common HTTP verbs: GET, POST, PUT, PATCH, DELETE
        - Basic understanding of HTTP status codes (200, 404, 500)
        - Working with JSON/XML in requests and responses
    - Ability to consume API using tools like NSWAG/POSTMAN
- Regular
    - Understands and able to apply in practice:
        - Understanding of idempotency and safe methods
        - Can integrate OAuth2 and JWT to secure API
        - Understanding API versioning methods (URL, headers, media type versioning)
        - Implement best practices for error responses, server side validation
        - Understands basic caching strategies
        - Ability to create API documentation using OpenAPI standard
        - Ability to specify proper HTTP status codes in responses for most of scenarios
        - Ability to create and consume basic GraphQL APIs, understanding queries, mutations and subscriptions
        - Understands basic auth like API keys or simple token-based authenticatio - FTP / SFTP, SMTP
    - Aware of:
        - Knowledge of all RESTful API maturity levels and how to use them
        - Protocols alternative to classic HTTP or REST APIs: GraphQL, AMQP - RabbitMQ SDK / Azure Service Bus SDK / MassTransit / NServiceBus, Kafka protocol
- Senior
    - Understands and able to apply in practice:
        - Designing scalable and maintainable API architectures
        - Implementing API monitoring, logging
        - Advanced features in GraphQL like schema stitching, error handling and performance optimization
        - Understanding backwards compatibility and decommissioning strategies for APIs
        - Understanding API gateways
        - Implementing advanced authentication and authorization patters, understanding OpenID Connect
        - Knowledge of all RESTful API maturity levels and how to use them
        - Protocols alternative to classic HTTP or REST APIs: GraphQL, FTP / SFTP, SMTP, AMQP - RabbitMQ SDK / Azure Service Bus SDK / MassTransit / NServiceBus, Kafka protocol

### Cloud Engineering

- Regular
    - Aware of:
        - Purpose of cloud computing
        - Vertical scaling vs horizontal scaling
        - PaaS, SaaS, IaaS
- Senior
    - Basic understanding of cloud concepts (hyperscaler, managed services, hybrid architecture)
    - Ability to adapt an application to a cloud environment
    - Understanding of Infrastructure-as-Code approach and basic knowledge of IaC toolset (like Azure Bicep, CloudFormation, Terraform)

### Data Storage

- Regular
    - Database related framework (jdbc, ORM - hibernate, spring-data etc.)
    - Types of NoSQL databases (document, key-value, column, graph etc.)
    - Distinction between relational database and NoSQL, differences in use
    - Relational databases - subqueries
    - Query plans and query optimizations
    - Pessimistic and optimistic locking
    - Transactions
    - Lazy vs eager loading
    - Entities and related annotations
    - Building queries to the database (native query, Criteria API, query methods, HQL)
    - Query logging
    - Lazy loading - problems (e.g. n+1 problem) and ways to solve them
    - What is JPA?
- Senior
    - Object state management
        - problems and benefits when mixing base access methods
        - native combined with other methods
    - Hibernate dirty checking
    - Cache - types
    - Entity graph
    - Transactions - isolation levels, propagation, how it works "under the hood"
    - Distributed databases - basics
    - Partitioning
    - Isolation levels

### DevOps

- Regular
    - Understands Docker Compose and CI/CD:
        - basic commands
        - aliases
        - templates
        - interaction with Docker
        - basic understanding of CICD pipelines in GitHub Actions / Jenkins
- Senior
    - Understands Dockerfile
        - FROM
        - RUN
        - CMD
        - ENTRYPOINT
        - ENV
        - build process of a Docker file
            - base images
            - container registries

### Java

- Regular
    - Encoding (UTF, ASCII)
    - Memory management - string pool, heap, stack, etc.
    - Generic types - wildcards
    - Basics of JVM
    - Garbage collector - basic knowledge
    - Stream API
    - Collections' implementations, usage, complexities (what's under the hood)
    - Multi-threading: synchronized keyword, deadlocks, race conditions, thread pools
- Senior
    - Follows java releases and latest enhancements in java ecosystem
    - JIT compiler
    - Garbage collector - knows various implementations and how they work
    - Stream API - parallel
    - Good knowledge of multi-threading , locks, cyclic barrier, latches, atomic classes, synchronized collections, virtual threads

### Software Engineering

- Regular
    - Understands and able to apply in practice knowledge about:
        - Design patterns: Adapter, Builder, Decorator
        - SOLID - can implement
        - Idempotency
        - Data structures: Trees (binary, red-black, AVL, B+, etc.), Priority Queue
        - Algorithms: Recursive algorithms, Trees search (DFS, BFS)
    - Aware of:
        - CQRS
        - DDD
        - Event storming
        - Event-streaming patterns: Event sourcing, Event schema registry, Event storage, Event sink
        - Integration Events
        - Microservices Architecture
        - Monolith Architecture
        - Functional Programming concepts
- Senior
    - Understands and able to apply in practice knowledge about:
        - Design patterns: Observer, Proxy, Visitor, Chain of Responsibility
        - Advanced software patterns: State Machines, Transactional Outbox, Retry, Circuit Breaker, Domain Events / Integration Events
        - Data structures: Graphs (directed, mixed, weighted, etc.), Merket tree
        - Algorithms: Graph searching (Dijkstra, A*, etc.), Runtime analysis (Big-O)
        - Consumer-driven Contract tests (CDC / Pact), E2E tests
        - Debugging: Intermediate window, Decompiling, PDB file, Multithreaded apps, Call stacks, Hot reload, Memory dumps,
        - SOLID - deep understanding
        - Saga

### Spring/JEE

- Regular
    - How to enable cache?
    - What the @Bean annotation is used for and how it differs from @Component
    - DI - how does it work? ways to inject dependencies
    - Useful patterns - e.g. strategy
    - Exception handling - global handler
    - Spring-data
    - How to secure an application (spring- security)
    - Ways of reading properties from properites files
    - Scopes of beans
- Senior
    - Reactive programming (WebFlux)
    - SpEL
    - AOP
    - creating your own annotations
    - dispatcher servlet - filters, interceptors
    - autoconfiguration
    - how to build a starter

### Testing

- Regular
    - Understands and able to apply in practice knowledge about:
        - Unit testing: Mocking, SRP, Naming, Setups
        - Integration testing: Preparing test cases, Concurrent tests
        - Testing design patterns
        - Tests data (generation or sourcing)
        - Aware of:
            - Testing styles: TDD, BDD
            - Advanced testing methodologies
            - Acceptance testing
            - Performance testing
            - Continuous Integration
- Senior
    - Understands and able to apply in practice knowledge about:
        - Integration testing: Setup from scratch, Time-based tests, Tests idempotency
        - Advanced testing methodologies: Acceptance testing, Performance testing
        - Testing styles: TDD, BDD
        - Continuous Integration
        - Aware of:
            - Advanced testing methodologies: Contract testing



































