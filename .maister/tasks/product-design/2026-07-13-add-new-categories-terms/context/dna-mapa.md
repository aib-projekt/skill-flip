# Architektura
## Aplikacyjna
### Model Domenowy
#### Elementy konstrukcyjne
- Polityki
- Widoki
- Zdarzenia
- Komendy
- Reguły
- Aktorzy
- Agregaty
  - zapewnienie spójności
  - agregują reguły spójne natychmiastowo
  - jednostki transakcji biznesoej
  - dobra praktyka to budowanie małych agregatów
  - zbudowane z encji i obiektów typu value

#### Transaction Script
- dla operacji typu bulk i złożonych odczytów

#### Model bogaty
- dane i reguły są razem (bogate encje OOP)
- dla złożonej i często zmiennej logiki

#### Model anemiczny
- dla prostej i rzadko zmiennej logiki
- dane i reguły są osobno (encja + serwis)

### Wzorce
#### Transport zdarzeń
- After commit
- Store and forward

#### Publikacja zdarzeń
- statyczna metoda publikująca
- wewnętrzna kolekcja w agregacie
- zwracanie jako wynik działania komendy

#### Command Query Responsibility Segregation
- komendy i zapytania oddzielone

### Mikrojądro
#### Zalety
- testowalność
- konfigurowalność
- rozszerzalność

#### Wady
- skalowalność
- złożoność

#### Cechy
- zawiera rejestr pluginów
- kontrakt między jądrem a pluginem

### Modularyzacja
- zawęża zakres zmiany
- jest środkiem (do ewolucyjności), a nie celem
- moduły grupują logicznie związane funkcje
- wymaga kontraktu (abstrakcji)
- wymaga enkapsulacji
  - ukrywanie szczegułów
  - ukrywanie rzeczy zmiennych
- coupling
  - miara tego, jak komponenty od siebie zależą
  - silny vs. lekki
  - jawny vs. niejawny
  - wchodzący vs. wychodzący
  - coupling semantyczny i coupling logiczny są mniej widoczne
  - zależność od komponentu stabilnego jest lepsz niż od komponentu często się zmieniającego
  - Law of Demeter
- kohezja
  - miara spójnego pogrupowania elementów w moduły
  - metryki
    - lack of cohesion of methods
- dobre praktyki
  - SOLID
  - GRASP

### Heksagonalna (porty i adaptery)
#### Zalety
- wspiera wymienialność
- ułatwia testowalność domeny
- rozwijalność i utrzymanie
- operacje typu I/O wykonane poza domeną

#### Wady
- wiele adapterów oznacza wiele testów
- atrybuty jakościowe architektury moga być złamane przez adapter
- trudniejsza nawigacja w kodzie
- potrzeba konfiguracji

#### Cechy
- domena w sercu aplikacji
- definicja portów wejściowych i wyjściowych
- implementacja portów za pomocą adapterów

### Pipes & Filters
#### Zalety
- proste zrównoleglenie i rozproszenie
- rozszerzalność
- konfigurowalność

#### Wady
- obsługa błędów rozproszona pomiędzy filtrami

#### Cechy
- filtry enkapsulują logikę i są od siebie niezależne
- rury (Pipes) łączą ze sobą filtry

### Persystencja
#### ACID
- Atomicity
- Consistency
- Isolation
  - anomalie
    - dirty write
    - dirty read
    - lost update
    - write skew
    - phantom read
- Durability
#### BASE
- Basicaly
- Available
- Soft state
- Eventualy consistency
#### Bazy danych
- RDDBMS
- NewSQL
- NoSQL
  - grafowe
  - dokumentowe
  - key-value
  - kolumnowe

#### Object-Relational Mapping
- automatyczny ORM
- brak (np. Transaction Script)
- własny kod zapisu i odczytu

#### Klasyczne trzy warstwy
##### Zalety
- wspiera wymienialność
- znana i rozumiana
- zmniejsza złożoność

##### Wady
- potrzeba zmian w kilku warstwach jednocześnie
- utrudniona testowalność

##### Cechy
- warstwa wyższa zależy od warstw niższych
- warstwy separują odpowiedzialność

## Systemowa
### System rozproszony
#### Błędne założenia przy rozpraszaniu systemu
- sieć jest niezawodna
- opóźnienie wynosi zero
- przepustowość jest nieskończona
- sieć jest bezpieczna
- topologia się nie zmienia
- jest jeden administrator
- koszt transportu wynosi zero
- sieć jest jednorodna
#### Koszty rozproszenia systemu
- analiaza i debugowanie
- bezpieczeństwo
- złożoność infrastruktury
- brak natychmiastowej transakcyjności
- trudniejsze zmiany przecinające komponenty w systemie
#### Cechy
- komunikacja sieciowa
- wiele jednostek wdrożeniowych
#### Enterprise Service Bus
- zalety
  - konfigurowalność
  - skalowalność usług
  - audytowalność
  - bezpieczeństwo
  - logowanie i śledzenie
- wady
  - ograniczona produktywność przy rozwoju szyny
  - wysoka cena
  - szyna to 'single point of failure'
- cechy
  - współdzielenie bibliotek klienckich
  - kanoniczny model danych
  - nacisk na orkiestrację
  - implementacja wzorca SOA
  - szyna integgracyjna z bogatym zestawem wtyczek (np. REST, SOAP, FTP)
#### Powody rozproszenia systemu
- organizacyjne
  - regulacje prawne
  - względy bezpieczeństwa
  - wielkość zespółu/projektu
  - proces wytwarzania
- techniczne
  - skalowalność
  - zasoby
  - odporność na błędy
  - dostępność
#### Mikroserwisy
- kryteria stosowalności
  - potrzeba szybkiej/wysokiej skalowalności
  - potrzeba autonomii
  - odpowiednie kompetencje
- wady
  - utrudniona analiza komunikacji
  - skomplikowana infrastruktura
  - wysoka złożoność technologiczna
  - dowolność technologiczna może prowadzić do chaosu
- cechy
  - cloude native
  - eliminacja punktów centralnych
  - zorientowane biznesowo
  - implementacja wzorca SOA
  - nacisk na choreografię
  - luźne powiązania komponentów
- zalety
  - niezależna odporność
  - autonomia
    - autonomia wdrożeń
    - autonomia technologiczna
    - autonomia rozwoju
- podział prac
  - zespół per projekt
    - wady
      - brak wiedzy eksperckiej
      - brak własności systemów
    - zalety
      - wymiana wiedzy technicznej
      - świadomość kontekstu
      - prosta koordynacja
  - zespół per system
    - wady
      - brak wymiany wiedzy technicznej
      - trudna koordynacja prac
      - brak świadomości kontekstu
    - zalety
      - znajomość systemu i domeny
      - poczucie własności
  - podejście mieszane
#### Komunikacja
- fire and forgot (One Way) (Event-Driven)
  - sementyka dostarczania
    - at most once delivery
    - at least once delivery
  - style
    - publsh-subscribe
      - notyfikacja
      - multi-replikacja
    - point-to-point (queue)
      - równoległe przetwarzanie
      - przetwarzanie w tle
      - bufor
- podejście "Design for Failure"
  - metrics
  - fallback
  - cache
  - rate limits
  - circuit breaker
  - retry
- testowalność (testy kontraktowe)
  - kontrakt przy kliencie
  - kontrakt przy producencie
    - kontrakt globalny
    - kontrakt per klient
- representational state transfer (REST), 4 poziomy dojrzałości
  - POX (Plain Old XML)
  - wydzielone zasoby
  - metody, nagłówki i kod HTTP
  - hypermedia as the engine of application state (HATEOAS)
- request-reply (Message-Driven)
  - typy
    - sync
      - thread pool
    - async
      - event loop
      - fibers
  - style
    - request-response
    - request-stream
    - channel (stream-stream)
- śledzenie (Distributed Tracing)
- service discovery
  - po stronie infrastruktury (np. Kubernetes)
  - po stronie aplikacji (np. Eureka, Consul)
- load balancing
  - clienr side load-balancing
  - server side load-balancing
### Monolit
- Zalety
  - prosta infrastruktura
  - szybkość i niezawodność komunikacji
  - transakcyjność
  - bezpieczeństwo komunikacji
  - możliwość szybkiego rozwiajania na starcie
- Wady
  - trudność zachowania struktury (big ball of mud)
  - trudność utrzymania
  - ograniczona skalowalność
    - infrastruktury
    - produktywności
    - wydajności
- Cechy
  - pojedyncza jednostak wdrożeniowa
  - samowystarczalność w zdefiniowanym zakresie
### Modularny monolit
- Zalety
  - proste utrzymanie
  - łatwa migracja do architektury rozproszonej
  - testowalność
- Wady
  - ograniczone stosowanie kluczy obcych (przy relacyjnej bazie danych)
  - duplikacja danych
  - trudniejsze zachowanie spójności 
- Cechy
  - pojedyncza jednostka wdrożeniowa
  - modularna struktura
  - moduły autonomiczne biznesowo
  - wybacza początkowo błędne wyznaczenie granic
    - podejście "monolith first" (nawet przy planowaniu systemu rozproszonego)

## Rzwiązania
### Decyzje
#### ADR
#### Podejmowanie
- Proces
  - fakty -> problemy -> rozwiązania
  - OODA loop
  - eksperymenty
- Metryki
  - wartości
    - cel
    - aktualna
    - limit
    - ideał
  - cechy
    - łatwo dostępna
    - jednoznaczna
    - mierzalna
  - typy
    - duża
    - jakościowa
- Drivery
  - klasy
    - cele projektowe
    - ograniczenia projektowe
    - wymagania funkcjonalne
    - atrybuty jakościowe
    - konwencje
  - cechy
    - nie muszą być spójne na poziomie całego systemu
    - opisują kontekst
    - zmieniają się w czasie
### Wizualizacja
#### UML
- sequence diagram
- deployment diagram
- activity diagram
- component diagram
#### BPMN
- wykonalne
- opisowe
- analityczne
#### C4
- landscape
- context
- container
- component
### Przestrzeń rozwiązania
#### Proces Level Event Storming
(projektujemy proces)
#### Bounded Contexts
- prawo Conwaya
  - zespół per bounded context
  - pilnowanie granic bounded context
- cechy
  - jest definiowany, nie odkrywany
  - jest granicą dla modelu domenowego
  - nie powinien przecinać subdoment
- ubiquitos language (język wszechobecny)
  - język domenowy bounded kontextu
  - jest platformą komunikacji
  - ewoluuje
- heurystyki walidacji granic
  - autonomia kontekstu
  - liczba kontekstów w procesie biznesowym
  - informacje zmieniające się razem
  - informacje używane razem
  - antywymagania
### Przestrzeń problemu
#### Domena
- zakres zainteresowań lub działalnośći jakiejś osoby, instytucji lub dziedziny wiedzy
#### Subdomeny
- typy
  - główna (core domain)
  - wspierająca (supporive subdomain)
  - generyczna (generic subdomain)
- heurystyki odkrywania
  - struktura organizacji
  - różni eksperci domenowi
  - język ekspertów domenowych
  - warość biznesowa
  - kroki procesu biznesowego
#### Big Picture Event Storming (odkrywamy, jak wygląda domena)
- cechy
  - szybki
  - stopniowy
  - uwidacznia braki
  - synchronizuje wiedzę
  - prosty
- przygotowanie
  - przestrzeń ściany
  - karteczki i flamastry
  - flipchart
  - minutnik
- fazy
- 0: rozpoczęcie
- 1: chaotyczna eksploracja
- 2: wprowadzenie osi czasu
- 3: opowieśćod końca
- 4: ludzie i systemy
- 5: problemy i okazje
- kogo zaprosić
  - stakeholder mapping
  - interesariusze wewnętrzni
    - właścicele
    - managerowie
    - pracownicy
  - interesariusze zewnętrzni
    - dostawcy
    - społeczeństwo
    - regulatorzy
    - udziałowcy
    - klienci
## Infrastruktury
### Chmura
#### Zdolności
- usługa na żądanie
- szeroki dostęp sieciowy
- usługa rozliczana
- pula zasobów
#### Modele rozmieszczania usług
- chmura publiczna
- chmura prywatna
- chmura hybrydowa
- chmura współdzielona (community)
#### Strategie korzystania
- vendor lock-in
  - szybkość wytwarzania
  - niższy koszt
- cloude agnostic
  - przenoszalność
  - wyższy koszt
  - niezależność od usług sieciowych
    - usługi stanowe (poziom infrastruktury)
    - usługi bezstanowe (poziom aplikacji)
#### Kontenery
- składowe
  - format obrazu
  - dystrybucja obrazu
  - środowisko uruchomieniowe
- zdolności
  - separacja od infrastruktury
  - dostarczanie aplikacji
  - przenaszalność
#### Kubernetes
- cechy
  - deklaratywna konfiguracja
  - elementy konstrukcyjne
  - elastyczne grupowanie zasobów (labels)
  - dostępny u wielu dostawców
- zdolności
  - automatyzacja wdrożeń
  - automatyzacja skalowania
  - auto-recovery kontenerów
  - zarządzanie sekretami
  - zarządzanie wolumenami
  - service discovery
#### Service Mesh
- płaszczyzny
  - danych (data plane)
  - kontroli (control plane)
  - komunikacja między usługami
  - zarządzanie ruchem
- zdolności
  - zarządzanie certyfiatami
  - zarządzanie ruchem
  - egzekwowanie reguł
  - obserwowalność
### Deployment Pipeline
#### Testowanie infrastruktury
- chaos engineering
- wydajnościowe
  - rodzaje
    - wydajnościowe (performance)
    - obciążeniowe (load)
    - wytrzymałościowe (stress)
  - wymagania
    - near-production environment
    - ruch produkcyjny
    - dane produkcyjne
    - odpowiednie rozgrzanie aplikacji (JIT, cache)
  - realia
    - niemiarodajne wyniki
    - drogie, a niska wiarygodność
    - preferujemy monitoring lub stress testing
#### Continuous Delivery
- wdrożenie (deployment) vs. wydanie (release)
  - wdrożenie – instalacja oprogramowania na wybranym środowisku
  - wydanie – udostępnienie nowych funkcji użytkownikom systemu
- software delivery performance
  - stabilność
    - wskaźnik awaryjności
    - czas przywrócenia usługi
  - szybkość
    - czas realizacji zmiany
    - częstotliwość wdrożeń
- taktyki
  - ciągłe wdrażanie
    - wdrożenie nie jest mechanizmem do wydawania
    - pragmatyczne podejście do częstotliwości wdrożeń 
  - ciągła inspekcja
    - analizy
      - analiza konfiguracji
      - analiza zależności
      - statyczna analiza kodu
      - pokrycie kodu testami
      - dynamiczna analiza aplikacji
    - sposoby integracji
      - raport
      - komentarz do pull request
      - przerywanie budowania
  - ciągła integracja
    - trunk based development (systemy oparte na modelu usługi)
      - future flags
        - branch abstraction
        - mechanizm do przeprowadzania wydań
      - podejścia
        - GitHub flow
        - Master only
    - scalanie wyników prac
      - merge kodu
      - aplikacja się buduje 
      - aplikacja działa poprawnie
      - aplikacja wdraża się poprawnie
      - aplikacja jest poprawnie skonfigurowana
    - git flow
      - wymaga koordynacji
      - integracja w release branch
#### Monitorowanie
- centralne logowanie
  - pliki płaskie
  - identyfikatory korelujące
  - spójna strefa czasowa (np. UTC)
  - wspólny format
  - uważaj na dane wrażliwe
  - jasna struktura wpisu
- co monitorować
  - wydajność systemu
  - interakcje użytkowników
  - metyryki biznesowe
  - stabilność systemu
    - liczba logowanych wyjątków
    - metryki
    - kody odpowiedzi HTTP
    - nieudane transakcje biznesowe
- Post mortem
  - "dlaczego ?" – root-cause analysis
  - domniemanie niewinności
  - środki zaradcze
  - składowe
    - oś czasu
    - wykresy, metryki
    - komunikacja, doraźne środki
    - wszystko, co potrzebne do analizy
### Inftastructure as Code
- niemutowalna infrastruktura
- testy konfiguracji
- GitOps
- zarządzanie sekretami
