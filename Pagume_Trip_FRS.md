# **PAGUME TRIP**

## **Functional Requirements Specification (FRS)**

**Product:** Pagume Trip  
**Version:** 1.0  
**Platform:** Flutter Mobile Application + Web Portals + Backend Platform  
**Initial Market:** Ethiopia  
**Product Type:** AI-Powered Multi-Agent Tourism Marketplace and Travel Management Platform

# **1. Executive Summary**

Pagume Trip is an AI-powered tourism platform designed initially for the Ethiopian tourism market.

The platform connects travelers with verified tourism providers including:

* Hotels and resorts
* Travel agencies
* Tour operators
* Car rental companies
* Private drivers
* Transportation providers
* Tour guides
* Activity and experience providers
* Restaurants and tourism-related businesses

The central differentiator of Pagume Trip is its multi-agent AI architecture.

Rather than functioning as a conventional question-and-answer chatbot, Pagume Trip will operate as an AI travel agent system capable of:

1. Understanding a traveler's objectives.
2. Planning trips.
3. Searching Pagume's verified tourism database.
4. Comparing available options.
5. Optimizing trips according to budget, time, preferences, and constraints.
6. Creating itineraries.
7. Checking availability.
8. Preparing and executing bookings.
9. Coordinating flights, accommodation, transportation, and activities.
10. Monitoring a trip.
11. Responding to changes.
12. Requesting user authorization before financial or irreversible actions.
13. Managing the complete travel lifecycle.

The AI system will consist of multiple specialized agents coordinated by a Supervisor/Orchestrator Agent.

# **2. Product Vision**

Pagume Trip aims to become:

The AI travel agent and verified tourism marketplace for Ethiopia.

The long-term user experience should be:

**Discover → Plan → Compare → Book → Travel → Monitor → Adapt**

Instead of forcing users to manually visit multiple websites and applications, Pagume should coordinate the travel process through one platform.

Example:

"I want to visit Lalibela for four days with my wife. Our total budget is 40,000 ETB. We want a comfortable hotel, a guided tour, and we don't want to drive ourselves."

Pagume should be able to:

* Identify Lalibela as the destination.
* Find verified accommodation.
* Find available transportation.
* Find registered tour agencies.
* Find relevant activities.
* Compare options.
* Calculate the total cost.
* Optimize the itinerary.
* Present suitable options.
* Ask for approval.
* Reserve/book the selected services.
* Store all bookings inside the user's trip.
* Monitor the trip.

# **3. Core Product Principles**

## **3.1 Database-First Tourism Information**

Pagume's tourism information must originate from the Pagume platform database.

The AI must not independently invent:

* Hotels
* Resorts
* Tour operators
* Car rental companies
* Tour packages
* Prices
* Availability
* Activities
* Tourism locations
* Provider information

If information is not present in the Pagume database or an explicitly integrated transactional provider, the agent must clearly state that the information is unavailable.

## **3.2 Verified Providers**

Tourism providers must register with Pagume.

Providers must be verified before their listings become publicly available.

Verification may include:

* Business registration information
* Identity verification
* Contact verification
* Tourism license information
* Vehicle documentation
* Hotel documentation
* Agency documentation
* Bank/payment information

Pagume administrators must have the ability to approve, reject, suspend, or deactivate providers.

## **3.3 Agentic Rather Than Conversational**

The AI should not simply answer questions.

It must be capable of taking actions through controlled tools.

# **4. User Roles**

Pagume shall support the following major user roles.

## **4.1 Traveler**

Travelers use the mobile application to:

* Discover destinations.
* Talk to the AI.
* Plan trips.
* Search tourism services.
* Book services.
* Manage trips.
* Review providers.
* Make payments.
* Manage their profile.

## **4.2 Hotel/Resort Provider**

Hotels and resorts can:

* Register their businesses.
* Manage their profiles.
* Upload images.
* Create rooms.
* Set prices.
* Manage availability.
* Define policies.
* Manage bookings.
* Respond to reviews.
* View analytics.

## **4.3 Travel Agency / Tour Operator**

Travel agencies can:

* Register their agencies.
* Create tour packages.
* Add destinations.
* Add activities.
* Add guides.
* Add vehicles.
* Set pricing.
* Manage availability.
* Manage bookings.
* Manage customers.
* View analytics.

## **4.4 Car Rental Provider**

Car rental companies can:

* Register their company.
* Add vehicles.
* Upload vehicle images.
* Define vehicle specifications.
* Set rental prices.
* Define availability.
* Define rental policies.⁷
* Manage reservations.

## **4.5 Driver**

Drivers may be registered independently or associated with a transportation provider.

Drivers can:

* Maintain profiles.
* Upload required documentation.
* Define availability.
* Accept assignments.
* View assigned trips.
* Update trip status.

## **4.6 Tour Guide**

Tour guides can:

* Register.
* Define expertise.
* Define languages.
* Add availability.
* Receive assignments.
* Manage bookings.

## **4.7 Pagume Administrator**

Administrators can:

* Manage users.
* Verify providers.
* Manage destinations.
* Moderate listings.
* Manage bookings.
* Manage disputes.
* Monitor AI agents.
* Manage payments.
* Manage platform configuration.
* View analytics.
* Suspend accounts.

# **5. Platform Components**

Pagume shall consist of the following major components:

## **5.1 Traveler Mobile Application**

Built initially using Flutter.

Primary functionality:

* Authentication
* AI Travel Agent
* Destination discovery
* Maps
* Search
* Trip planning
* Bookings
* Payments
* Notifications
* Reviews
* Profile

## **5.2 Provider Web Portal**

Used by:

* Hotels
* Resorts
* Travel agencies
* Tour operators
* Car rental companies
* Transportation providers
* Guides

## **5.3 Administration Portal**

Used by Pagume administrators.

## **5.4 Backend API**

Responsible for:

* Authentication
* Business logic
* Database operations
* Booking management
* Payments
* Provider management
* Availability
* AI tools
* Notifications
* Audit logging

## **5.5 AI Multi-Agent System**

The AI system shall contain multiple specialized agents coordinated by a supervisor.

# **6. Multi-Agent Architecture**

Pagume shall not rely on a single AI agent to perform all operations.

A **Supervisor Agent** will coordinate specialized agents.

## **6.1 Supervisor Agent**

The Supervisor Agent is responsible for:

* Understanding the user's overall objective.
* Breaking the objective into tasks.
* Assigning tasks to specialized agents.
* Maintaining the overall travel context.
* Combining results.
* Resolving conflicts.
* Requesting user approval when required.
* Monitoring execution.
* Handling failures.

# **7. Specialized AI Agents**

## 7.1 Destination Agent

Responsibilities:

* Identify destinations from the Pagume database.
* Retrieve destination information.
* Find nearby destinations.
* Find attractions.
* Determine destination suitability.
* Return verified destination information.

The agent shall never create a destination record itself.

Example tool:

search\_destinations()7

get\_destination()

find\_nearby\_destinations()

## 7.2 Flight Agent

Responsibilities:

* Search available flights.
* Compare flights.
* Filter flights.
* Evaluate travel times.
* Evaluate prices.
* Check baggage information where available.
* Prepare flight reservations.
* Execute authorized bookings.
* Manage cancellations/modifications where supported.

The Flight Agent may interact with approved external flight APIs.

All external flight results must be normalized into Pagume's internal flight model.

## 7.3 Accommodation Agent

Responsibilities:

* Search hotels.
* Search resorts.
* Search lodges.
* Search guesthouses.
* Compare accommodation.
* Check availability.
* Compare prices.
* Evaluate amenities.
* Check location.
* Prepare reservations.
* Execute authorized bookings.
* Manage cancellation/modification.

Primary source:

Pagume Accommodation Database

## 7.4 Transportation Agent

This agent manages transportation other than flights.

Supported transportation types:

* Private car
* Car rental
* Taxi
* Minibus
* Bus
* Tour vehicle
* Airport transfer
* Driver service
* Boat transportation
* Other registered transportation services

Responsibilities:

* Search transportation.
* Compare transportation.
* Calculate cost.
* Check availability.
* Reserve transportation.
* Assign drivers where applicable.
* Manage transportation bookings.

## 7.5 Car Rental Agent

The Car Rental Agent

It shall evaluate:

* Vehicle type
* Seats
* Transmission
* Fuel type
* Daily price
* Rental duration
* Driver availability
* Mileage limitations
* Deposit
* Insurance
* Pickup location
* Drop-off location

## 7.6 Tour Agency Agent

Responsibilities:

* Search registered agencies.
* Search tour packages.
* Compare packages.
* Check availability.
* Analyze inclusions/exclusions.
* Compare prices.
* Reserve tours.
* Manage tour bookings.

## 7.7 Activity/Experience Agent

Responsibilities:

* Search registered activities.
* Find activities near destinations.
* Match activities with user preferences.
* Check availability.
* Calculate prices.
* Book experiences.

Examples:

* Hiking
* Cultural experiences
* Coffee ceremonies
* Boat trips
* Photography tours
* Historical tours
* Wildlife experiences
* Food experiences

## 7.8 Budget Agent

The Budget Agent manages the financial constraints of a trip.

It shall:

* Calculate estimated total cost.
* Track actual costs.
* Compare alternatives.
* Detect budget violations.
* Optimize expenses.
* Recommend cost-saving alternatives.

The Budget Agent shall notify the Supervisor if a proposed action exceeds the user's budget.

## 7.9 Itinerary Agent

The Itinerary Agent creates and manages travel schedules.

It shall consider:

* Destination
* Distance
* Travel time
* Opening hours
* Activity duration
* Hotel location
* Transportation
* User preferences
* Budget
* Weather where available
* Existing bookings

The itinerary shall be represented as structured data, not only generated text.

## 7.10 Map/Location Agent

Responsibilities:

* Resolve destination coordinates.
* Find nearby registered providers.
* Calculate distances.
* Determine routes where supported.
* Display locations.
* Support map-based exploration.

The Map Agent must use Pagume's tourism database for tourism entities.

## 7.11 Booking Agent

The Booking Agent handles transactional operations.

Responsibilities:

* Create booking.
* Validate availability.
* Validate price.
* Request authorization.
* Execute booking.
* Store confirmation.
* Generate booking reference.
* Handle booking status.
* Process cancellation where supported.

The Booking Agent must not independently decide to spend money without authorization.

## 7.12 Trip Monitoring Agent

After a trip is booked, the Trip Monitoring Agent becomes responsible for monitoring the trip.

It can detect:

* Booking changes
* Transportation changes
* Provider messages
* Schedule conflicts
* Cancellations
* Delays where integrated
* Itinerary conflicts

It can notify the Supervisor Agent when intervention is required.

## 7.13 Communication Agent

Responsible for:

* Push notifications
* Email
* SMS
* In-app messages
* Provider communication
* Booking confirmations
* Reminders

# **8. Agent Tool System**

Agents must not have unrestricted access to the database.

They shall interact with controlled application tools.

Examples:

search\_hotels()

check\_hotel\_availability()

get\_hotel\_details()

search\_rooms()

reserve\_room()

cancel\_hotel\_booking()

Transportation:

search\_transport()

search\_car\_rentals()

check\_vehicle\_availability()

reserve\_vehicle()

Tours:

search\_tour\_packages()

get\_package\_details()

check\_tour\_availability()

reserve\_tour()

Trip:

create\_trip()

update\_itinerary()

calculate\_trip\_cost()

optimize\_trip()

# **9. Agent Permission Model**

Every tool must have a defined permission level.

## **READ**

Examples:

* Search hotels
* Search destinations
* Search cars
* Search tours

No user approval required.

## **PREPARE**

Examples:

* Create itinerary
* Prepare booking
* Hold reservation where supported

User may review before execution.

## **TRANSACTIONAL**

Examples:

* Charge payment
* Confirm booking
* Cancel paid reservation

Explicit authorization required unless the user has previously granted an appropriate spending authorization.

# **10. Destination Management**

Administrators shall be able to create destinations.

Destination fields shall include:

* Name
* Description
* Region
* Zone
* Woreda where applicable
* Latitude
* Longitude
* Images
* Videos
* Category
* Historical information
* Cultural information
* Recommended duration
* Accessibility information
* Seasonal information
* Status
* Verification status

# **11. Hotel and Resort Portal**

Providers shall be able to register their properties.

## **Hotel Profile**

Fields:

* Name
* Description
* Address
* GPS coordinates
* Contact details
* Images
* Amenities
* Policies
* Check-in time
* Check-out time
* Cancellation policy

## **Rooms**

Each room shall have:

* Room type
* Description
* Capacity
* Beds
* Amenities
* Images
* Price
* Availability

# **12. Travel Agency Portal**

Agencies shall be able to create:

* Tour packages
* Day trips
* Multi-day tours
* Custom tours

Each package shall include:

* Name
* Description
* Destination
* Duration
* Price
* Maximum participants
* Minimum participants
* Included services
* Excluded services
* Accommodation
* Transportation
* Activities
* Guide
* Images
* Availability
* Cancellation policy

# **13. Car Rental Portal**

Car rental providers shall manage:

* Vehicles
* Vehicle categories
* Pricing
* Availability
* Pickup locations
* Drop-off locations
* Rental policies

Vehicle information:

* Make
* Model
* Year
* Seats
* Transmission
* Fuel type
* 4WD status
* Images
* Daily price
* Weekly price
* Deposit
* Insurance
* Driver availability

# **14. Driver Management**

Drivers shall have:

* Name
* Profile picture
* License information
* Languages
* Experience
* Location
* Availability
* Provider association
* Verification status

Driver documents must be verified by Pagume administrators.

# **15. Tourism Marketplace**

Users shall be able to browse:

* Destinations
* Hotels
* Resorts
* Tours
* Activities
* Car rentals
* Drivers
* Transportation
* Restaurants

Search results must support:

* Location
* Price
* Rating
* Availability
* Category
* Distance
* Amenities
* Provider
* Date

# **16. AI Search**

Users should be able to search naturally.

Examples:

"Find me a hotel near Lalibela churches under 5,000 ETB per night."

"Find a 4WD for six people in Gorgora."

"Show me a three-day tour of northern Ethiopia."

The AI converts natural language into structured search parameters.

# **17. AI Recommendation System**

Recommendations should consider:

* User preferences
* Budget
* Group size
* Destination
* Dates
* Availability
* Previous bookings
* Reviews
* Provider status
* Distance
* Travel time

The recommendation engine must only recommend valid inventory.

# **18. Maps**

The mobile application shall include interactive maps.

Map features:

* Destination markers
* Hotel markers
* Restaurant markers
* Activity markers
* Transportation markers
* Car rental locations
* Tour agency locations
* User location
* Routes
* Distance calculation

Only verified Pagume tourism records should be displayed as Pagume tourism entities.

# **19. Trip Object**

Every planned journey shall be represented by a Trip.

The Trip shall contain:

* Flights
* Hotels
* Transportation
* Tours
* Activities
* Restaurants
* Payments
* Itinerary
* Documents
* Notifications

# **20. Booking Management**

Every booking must have:

* Booking ID
* User
* Provider
* Service
* Price
* Currency
* Date
* Status
* Payment status
* Confirmation code
* Cancellation policy
* Created timestamp

Booking statuses:

DRAFT

PENDING

AUTHORIZED

CONFIRMED

CANCELLED

FAILED

COMPLETED

REFUNDED

# **21. Payment System**

Pagume shall support payments for:

* Hotels
* Tours
* Transportation
* Car rentals
* Activities
* Other services

The payment architecture should support multiple payment providers.

The system must not store raw card information unless explicitly designed and certified for such handling.

Payment status must be separated from booking status.

# **22. Reviews and Ratings**

After completing a service, travelers can review:

* Hotel
* Agency
* Driver
* Tour
* Activity
* Car rental

Reviews shall contain:

* Rating
* Text
* Images where supported
* Date
* Verified booking indicator

Only users with qualifying bookings should be allowed to submit verified reviews.

# **23. Provider Verification**

Providers shall have statuses:

UNDER\_REVIEW

VERIFIED

REJECTED

SUSPENDED

Only VERIFIED providers can appear in normal AI recommendations.

Administrators shall be able to request additional documents.

# **24. AI Data Governance**

The AI must distinguish between:

### **Verified Data**

Information from Pagume's database.

### **External Transactional Data**

Information retrieved through approved APIs such as flight availability.

### **Generated Information**

AI-generated itinerary descriptions, summaries, recommendations, and explanations.

Generated information must not be presented as verified factual inventory unless supported by the underlying data.

# **25. No-Hallucination Requirement**

If the database contains:

Gorgora Resort

the agent may recommend it.

If it does not contain:

Hotel ABC

the agent must not invent it.

Instead:

"I couldn't find a verified hotel matching that requirement in Pagume's current inventory."

This is a core product requirement.

# **26. Provider Availability**

Providers shall be able to manage availability.

Hotels:

Room 101

Available:

Sept 10

Sept 11

Sept 12

Cars:

Toyota Land Cruiser

Available:

Sept 10-15

Tours:

Northern Ethiopia Tour

Seats:

8 / 12 remaining

The AI must query availability before attempting a booking.

# **27. Booking Conflict Prevention**

The system must prevent:

* Double booking
* Overbooking
* Invalid reservations
* Expired availability
* Booking unavailable vehicles
* Booking unavailable rooms

The backend must perform final availability validation immediately before transaction execution.

# **28. Agent Memory**

Pagume shall maintain two types of memory.

## **Short-Term Trip Memory**

Current conversation and current trip.

Example:

Destination = Lalibela

Travelers = 2

Budget = 50,000 ETB

Dates = Sept 10-14

## **Long-Term User Preferences**

Examples:

* Preferred accommodation type
* Preferred transportation
* Budget range
* Travel interests
* Preferred destinations
* Dietary preferences

Users must be able to view and modify stored preferences.

# **29. Agent Communication**

Agents shall communicate through structured messages rather than unrestricted natural-language messages.

Example:

{

"agent": "hotel\_agent",

"task": "search",

"destination\_id": "dest\_123",

"check\_in": "2026-09-10",

"check\_out": "2026-09-14",

"guests": 2,

"max\_price": 5000

}

Response:

{

"status": "success",

"results": [

{

"hotel\_id": "hotel\_123",

"room\_id": "room\_10",

"price": 4500,

"currency": "ETB"

}

]

}

This improves reliability and auditability.

# **30. Agent Failure Handling**

If one agent fails, the Supervisor must handle the failure.

The system must not silently claim that an action succeeded.

# **31. Transaction Safety**

Booking operations must be idempotent.

If a booking request is accidentally sent twice, Pagume must not create two bookings.

Every transactional request should have an idempotency key.

# **32. Human-in-the-Loop**

The user must remain in control of important actions.

The system shall require confirmation for:

* Payments
* Final bookings
* Expensive purchases
* Cancellations with fees
* Significant itinerary changes

# **33. Autonomous Trip Management**

Once authorized, Pagume may perform predefined actions within the user's authorization.

Example:

"You have authorized Pagume to manage this trip up to 50,000 ETB."

The system may then:

* Reserve eligible services.
* Adjust transportation.
* Recalculate itinerary.
* Notify the traveler.
* Handle approved changes.

Any action exceeding the authorization limit must request additional approval.

# **34. Notifications**

The platform shall support:

* Booking confirmation
* Payment confirmation
* Trip reminders
* Check-in reminders
* Provider messages
* Booking changes
* Cancellation notifications
* Agent action notifications

# **35. Traveler Dashboard**

TBD

# **36. AI Agent Interface**

The AI interface should show more than a chat stream.

It should expose **agent activity**.

Example:

Pagume is planning your trip...

✓ Found destination

✓ Searching hotels

✓ Comparing transportation

✓ Finding tours

✓ Calculating budget

✓ Building itinerary

Your trip is ready.

This visually communicates that the system is performing actions.

# **37. Provider Analytics**

Providers shall have analytics including:

* Profile views
* Search appearances
* AI recommendations
* Booking requests
* Confirmed bookings
* Revenue
* Cancellation rate
* Reviews
* Conversion rate

A particularly valuable metric could be:

**"AI Recommendation Views"**

This shows providers how frequently Pagume's agents recommend their services.

# **38. Administrative Tourism Data Management**

Administrators must be able to manage:

* Destinations
* Regions
* Cities
* Tourism categories
* Attractions
* Providers
* Activities
* Transportation
* Tourism metadata
* Images
* Verification status

The admin portal should support bulk import/export for initial tourism data onboarding.

# **39. Search Architecture**

Pagume shall support both:

### **Structured Search**

destination = Lalibela

price < 5000

rating >= 4

### **Semantic Search**

User:

"I want a quiet romantic place near the historical attractions."

The semantic layer identifies suitable database records.

The AI may use embeddings/vector search to improve semantic discovery, but the final entities must map back to actual Pagume database records.

# **40. Recommended Data Architecture**

Primary database:

**PostgreSQL**

Recommended supporting components:

PostgreSQL

│

├── Transactional data

├── Users

├── Providers

├── Tourism inventory

├── Bookings

└── Payments

PostGIS

│

└── Geographic tourism data

Redis

│

├── Caching

├── Sessions

└── Temporary availability

Object Storage

│

└── Provider images/documents

Vector Database / pgvector

│

└── Semantic tourism search

PostgreSQL + PostGIS + pgvector can provide a strong initial foundation without unnecessarily introducing multiple databases.

# **41. Core Database Entities**

The initial relational model should include at minimum:

users

user\_preferences

providers

provider\_documents

provider\_staff

destinations

destination\_categories

destination\_images

hotels

hotel\_rooms

hotel\_amenities

hotel\_images

hotel\_availability

travel\_agencies

tour\_packages

tour\_package\_items

tour\_availability

transport\_providers

vehicles

vehicle\_availability

drivers

activities

activity\_availability

flights

flight\_inventory

trips

itineraries

itinerary\_items

bookings

booking\_items

payments

refunds

reviews

notifications

agent\_tasks

agent\_actions

agent\_runs

audit\_logs

# **42. AI Agent Database Access**

Agents must not directly execute arbitrary SQL.

Incorrect:

Agent → PostgreSQL

Preferred:

Agent

↓

Tool

↓

Service Layer

↓

Repository

↓

PostgreSQL

This protects the database and allows business rules to remain centralized.

# **43. AI Agent Observability**

The platform shall record:

* Agent invoked
* Task
* Input
* Tools called
* Tool results
* Decisions
* Errors
* Duration
* Token usage where relevant
* Final result
* User approval
* Transaction outcome

This is essential for debugging an agentic platform.

# **44. Security Requirements**

The platform shall implement:

* JWT/OAuth authentication
* Role-based authorization
* Provider permissions
* Agent permissions
* API authentication
* Rate limiting
* Audit logs
* Encryption in transit
* Encryption at rest where appropriate
* Secure document storage
* Payment security
* Input validation
* File upload validation
* Fraud detection mechanisms

# **45. Provider Content Moderation**

Uploaded:

* Images
* Descriptions
* Videos
* Packages

must be subject to platform moderation.

Pagume administrators shall be able to:

* Approve
* Reject
* Request changes
* Hide content
* Suspend provider

# **46. MVP Scope**

The first production version should **not attempt to implement every possible tourism service**.

I recommend the MVP contain:

## **Traveler**

* Registration/login
* AI Supervisor
* Destination discovery
* Map
* Hotels
* Travel agencies
* Tour packages
* Car rental
* Transportation
* Trip planner
* Budget planner
* Itinerary
* Booking
* Payments
* Notifications
* Reviews

## **Provider**

* Registration
* Verification
* Profile
* Image upload
* Inventory management
* Pricing
* Availability
* Booking management

## **AI Agents**

Supervisor Agent

Destination Agent

Accommodation Agent

Transportation Agent

Tour Agent

Car Rental Agent

Budget Agent

Itinerary Agent

Booking Agent

# **47. Phase 2**

Add:

* Flight integrations
* Driver marketplace
* Tour guide marketplace
* Activities
* Restaurants
* Advanced route optimization
* Proactive trip monitoring
* Voice assistant
* AI translation
* Advanced recommendations
* Provider analytics

# **48. Phase 3**

Add:

* Autonomous trip management
* Advanced multi-agent planning
* Dynamic rebooking
* International destinations
* African tourism expansion
* Loyalty program
* Travel insurance integration
* Corporate travel
* Group travel
* Travel communities

# **49. Example End-to-End Scenario**

## **User Request**

"I want to visit Gorgora for four days with my family. We are six people. Our budget is 60,000 ETB. We want a comfortable hotel, a private vehicle, and a boat trip."

### **Supervisor Agent**

Extracts:

Destination:

Gorgora

Travelers:

6

Duration:

4 days

Budget:

60,000 ETB

Accommodation:

Comfortable

Transport:

Private vehicle

Activity:

Boat trip

### **Destination Agent**

Finds:

Gorgora

### **Accommodation Agent**

Searches Pagume database.

Returns:

Resort A

Hotel B

Lodge C

### **Transportation Agent**

Finds:

Vehicle A

Vehicle B

Vehicle C

### **Activity Agent**

Finds:

Boat Trip A

Boat Trip B

### **Budget Agent**

Calculates combinations.

Option A

Hotel: 18,000

Vehicle: 20,000

Boat: 6,000

Estimated: 44,000 ETB

### **Itinerary Agent**

Creates:

Day 1

Travel → Check-in → Resort

Day 2

Boat trip → Lake Tana exploration

Day 3

Cultural activities → Relaxation

Day 4

Breakfast → Check-out → Return

### **Supervisor**

Presents:

**I found a complete four-day Gorgora trip for approximately 44,000 ETB.**

Then:

**[Review] [Book Trip] [Modify]**

The user clicks **Book Trip**.

### **Booking Agent**

Executes:

Hotel reservation

↓

Vehicle reservation

↓

Boat reservation

The system returns:

✓ Hotel confirmed

✓ Vehicle confirmed

✓ Boat trip confirmed

Trip ID: PT-82931

The trip is now stored in the user's account.

# **50. Fundamental Product Architecture**

The complete system can therefore be represented as:

PAGUME TRIP

│

┌───────────────┴────────────────┐

│ │

TRAVELER APP PROVIDER PORTALS

│ │

└───────────────┬────────────────┘

│

PAGUME API

│

┌───────────────┴────────────────┐

│ │

MULTI-AGENT SYSTEM PLATFORM SERVICES

│ │

┌──────┼─────────────┐ ┌───────┼─────────┐

│ │ │ │ │ │

Supervisor │ │ Booking Payment Maps

│ │ │

┌─────┼──────┼──────┐ │

│ │ │ │ │

Dest Hotel Transport Tour │

Agent Agent Agent Agent │

│ │ │ │ │

└─────┼──────┼──────┴──────┘

│

▼

PAGUME TOOL LAYER

│

▼

┌──────────────────────────────┐

│ VERIFIED INVENTORY │

├──────────────────────────────┤

│ Destinations │

│ Hotels │

│ Rooms │

│ Tour Agencies │

│ Tour Packages │

│ Activities │

│ Vehicles │

│ Drivers │

│ Transportation │

│ Availability │

└───────────────┬──────────────┘

│

▼

POSTGRESQL

+ POSTGIS

+ PGVECTOR

# **51. Final Product Definition**

Pagume Trip should not be designed as:

**"ChatGPT for Ethiopian tourism."**

It should be designed as:

**"An AI-operated tourism marketplace where travelers can discover, plan, book, and manage trips using verified Ethiopian tourism inventory."**

The **database is the marketplace**.

The **provider portals create and maintain the inventory**.

The **multi-agent system operates on that inventory**.

The **mobile application is the traveler's interface**.

The **booking engine performs transactions**.

The **maps visualize the verified geographic data**.

And the **Supervisor Agent coordinates the specialized agents to accomplish the user's travel objective.**

The most important architectural rule should remain:

**Agents reason; tools execute; the database provides truth; providers provide inventory; users authorize consequential actions.**

That separation will make Pagume substantially easier to scale, secure, audit, and eventually expand beyond Ethiopia.