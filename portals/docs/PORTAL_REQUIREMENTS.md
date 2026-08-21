# Pagume Trip - Portal Requirements Specification

This document extracts and organizes the functional requirements specifically for the **Pagume Trip Portals**, as derived from the main Functional Requirements Specification (FRS).

## 1. Overview
The Pagume Trip system includes two primary web portals:
1. **Provider Web Portal**: Used by registered tourism providers (Hotels, Resorts, Travel agencies, Tour operators, Car rental companies, Transportation providers, Guides).
2. **Administration Portal**: Used by Pagume administrators for platform governance, moderation, and data management.

---

## 2. Provider Web Portal

### 2.1 General Provider Features (MVP Scope)
All providers in the MVP must have access to:
* **Registration & Verification**: Secure registration process with document submission.
* **Profile Management**: Update business details, contact info, and policies.
* **Media Management**: Image and video uploads for listings.
* **Inventory Management**: Create and manage available services/items.
* **Pricing & Availability**: Set pricing and manage availability calendars.
* **Booking Management**: View, accept, manage, and process bookings.
* **Review Management**: Respond to traveler reviews.

### 2.2 Hotel and Resort Portal (Section 11)
**Property Profile Fields:**
* Name, Description, Address, GPS coordinates, Contact details
* Images, Amenities, Policies (Check-in time, Check-out time, Cancellation policy)

**Room Management:**
* Each room listing must include: Room type, Description, Capacity, Beds, Amenities, Images, Price, Availability calendar.

### 2.3 Travel Agency & Tour Operator Portal (Section 12)
**Package Management:**
* Agencies can create: Day trips, Multi-day tours, Custom tours, Tour packages.
* Package details must include:
  * Name, Description, Destination, Duration
  * Price, Max/Min participants
  * Included/Excluded services
  * Accommodation, Transportation, Activities, Guide details
  * Images, Availability calendar, Cancellation policy

### 2.4 Car Rental Portal (Section 13)
**Fleet Management:**
* Manage Vehicles, Vehicle categories, Pricing, Availability, Pickup/Drop-off locations, Rental policies.
* Vehicle specific details:
  * Make, Model, Year, Seats, Transmission, Fuel type, 4WD status
  * Images
  * Pricing: Daily price, Weekly price, Deposit, Insurance
  * Driver availability (Self-drive vs. Chauffeur)

### 2.5 Driver & Guide Management (Section 14 & 4.6)
**Driver Profiles:**
* Name, Profile picture, License information, Languages, Experience, Location, Availability, Provider association, Verification status.
* *Note: Driver documents must be verified by Pagume administrators.*

**Tour Guide Profiles:**
* Expertise, Languages, Availability.
* Manage assignments and bookings.

### 2.6 Provider Analytics (Section 37)
Providers shall have an analytics dashboard to track performance:
* Profile views, Search appearances
* **AI Recommendation Views**: How frequently Pagume's AI agents recommend their services.
* Booking requests, Confirmed bookings
* Revenue, Cancellation rate, Reviews, Conversion rate.

---

## 3. Administration Portal

### 3.1 Tourism Data & Taxonomy Management (Section 38 & 10)
Administrators manage the foundational tourism data mapping:
* **Locations**: Destinations, Regions, Cities, Zones, Woredas.
* **Categories**: Tourism categories, Attractions, Activities, Transportation types, Metadata.
* **Destination Entity Fields**: Name, Description, Region, GPS (Lat/Long), Images, Videos, Category, Historical/Cultural/Seasonal information, Recommended duration, Accessibility.
* *Note: The admin portal should support bulk import/export for initial tourism data onboarding.*

### 3.2 Provider Verification & Moderation (Section 23 & 45)
* **Verification Workflow**: Providers are categorized as `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`.
* Administrators can request additional documents for verification.
* **Content Moderation**: 
  * Moderate uploaded Images, Descriptions, Videos, and Packages.
  * Admin actions: Approve, Reject, Request changes, Hide content, Suspend provider.

### 3.3 Platform Governance (Section 4.7)
Administrators have overarching control to:
* Manage users and providers.
* Manage bookings, payments, and disputes.
* Monitor AI agents (View observability logs: Agent invoked, Tasks, Inputs, Tool results, Decisions, Errors).
* Configure platform settings and view global analytics.

---

## 4. Technical & Architectural Constraints
* **Authentication**: JWT/OAuth authentication with strict Role-based authorization.
* **Database**: PostgreSQL (relational data), PostGIS (geographic data), Object Storage (images/documents).
* **AI Governance**: Generated information must not be presented as verified factual inventory unless it exists in the provider-supplied database. Providers are responsible for the factual accuracy of their inventory.
