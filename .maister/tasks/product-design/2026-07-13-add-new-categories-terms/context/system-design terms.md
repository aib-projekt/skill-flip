
- Kafka
    - topics

- Redis
    - cache for ticketId

- Elasticsearch (AWS OpenSearch)
    - DB to speedUp searching - tokenizing names, localisations, dates

- Zookeeper

- CDN (Content Delivery Network)
    - local cache that help in speedUp static web
    - can cache API requests
        - question is how much permutation of parameter you can have on your query the more parameters you have the more CDN space you consume
        - !!! take car with user personalisation - answer is same for all

- Network cmmunication strategy
    - Latency sensitive?
        - no: simple polling
        - yes: frequent, bidirectional communication?
            - no: SSE
            - yes: Peer to Peer? Audio/Video?
                - no: websocket
                - yes: webRTC
