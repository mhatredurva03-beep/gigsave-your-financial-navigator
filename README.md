# GigSave: Your Financial Navigator

You are an expert Product Manager, Senior UX/UI Designer, Software Architect, Database Architect, and Senior Full-Stack Developer.

Your task is to build a **production-ready** application called **GigSave – Smart Expense & Goal Tracker for Gig Workers**.

I have already prepared the following documents:

• Standard Operating Procedure (SOP)

• Product Requirements Document (PRD)

• Technical Specification Document (TSD)

• Design Specification Document (DSD)

These documents are the **single source of truth**. Read them carefully and follow them throughout development. Do not modify any requirements, workflows, UI, business logic, or database structure unless there is a technical limitation.

The goal is to create a real-world product that is scalable, maintainable, secure, responsive, and visually polished.

────────────────────────────────────────

PROJECT OVERVIEW

────────────────────────────────────────

GigSave is a modern financial management platform designed specifically for gig workers who earn different amounts every day.

Target users include:

• Zomato Delivery Partners

• Swiggy Riders

• Blinkit Riders

• Zepto Riders

• Uber Drivers

• Ola Drivers

• Rapido Captains

• Freelancers

• Daily Wage Workers

Unlike traditional budgeting applications, GigSave focuses on daily income instead of monthly salary.

Users can:

• Record income manually

• Record income using voice

• Track expenses

• Automatically distribute earnings into savings jars

• Create financial goals

• Track savings progress

• View analytics

• Receive smart financial insights

The application should encourage financial discipline while remaining extremely simple to use.

────────────────────────────────────────

TECH STACK

────────────────────────────────────────

Frontend

• React.js

• Vite

• JavaScript (ES6+)

• Tailwind CSS

• React Router

• Recharts

• Lucide React

Backend

• Supabase

Database

• PostgreSQL (Supabase)

Authentication

• Supabase Auth

Hosting

• Vercel

────────────────────────────────────────

DESIGN REQUIREMENTS

────────────────────────────────────────

Strictly follow the Design Specification Document.

The UI should resemble premium fintech applications such as:

• CRED

• Fi Money

• Jupiter

• Revolut

• Monzo

Do NOT copy their interfaces.

Take inspiration only.

The application should feel premium, modern and elegant.

Design principles:

• Minimal UI

• White background

• Glassmorphism

• Large rounded cards

• Soft shadows

• Beautiful gradients

• Excellent spacing

• Premium typography

• Smooth animations

• Responsive layout

• Reusable design system

Use:

• Donut charts

• Circular progress indicators

• Financial summary cards

• Animated statistics

• Interactive charts

• Floating action button

• Beautiful empty states

• Skeleton loading screens

Every screen should look production-ready.

────────────────────────────────────────

CORE MODULES

────────────────────────────────────────

Authentication

• Sign Up

• Login

• Forgot Password

• Logout

Dashboard

Display:

• Greeting

• Today's Earnings

• Today's Expenses

• Today's Savings

• Available Balance

• Savings Jars

• Active Goals

• Financial Health Score

• AI Insight Card

• Recent Transactions

Income Module

• Add Income

• Edit Income

• Delete Income

• Income History

• Voice Income Entry

Expense Module

• Add Expense

• Edit Expense

• Delete Expense

• Expense Categories

• Voice Expense Entry

Savings Jars

Users can create unlimited jars.

Example jars:

• Emergency

• Family

• Bike

• Investment

• Education

• Vacation

Each jar should contain:

• Name

• Icon

• Percentage

• Current Balance

• Progress

• Linked Goal

Goals

Users can:

• Create Goal

• Edit Goal

• Delete Goal

Each goal should contain:

• Goal Name

• Target Amount

• Saved Amount

• Remaining Amount

• Progress Percentage

• Estimated Completion

Analytics

Display:

• Daily Income

• Weekly Income

• Monthly Income

• Expense Breakdown

• Savings Growth

• Goal Progress

• Income Source Comparison

Profile

Include:

• User Information

• Language

• Notifications

• Theme

• Logout

Notifications

• Daily Reminder

• Goal Reminder

• Budget Alert

• Savings Reminder

────────────────────────────────────────

BUSINESS LOGIC

────────────────────────────────────────

Whenever a user records income, automatically distribute the earnings into savings jars according to the percentages configured by the user.

Example

Income = ₹1,000

Emergency = 20%

Family = 15%

Investment = 10%

Bike = 10%

Automatically allocate:

Emergency → ₹200

Family → ₹150

Investment → ₹100

Bike → ₹100

The remaining amount becomes the Available Balance.

Users should never calculate savings manually.

All calculations must happen automatically.

Update:

• Dashboard

• Jar Balances

• Goal Progress

• Analytics

• Financial Health Score

after every transaction.

────────────────────────────────────────

DATABASE

────────────────────────────────────────

Follow the TSD exactly.

Create all required tables.

Use:

• UUID Primary Keys

• Foreign Keys

• Row Level Security

• Supabase Policies

• Timestamps

• Proper Relationships

Optimize queries for performance.

────────────────────────────────────────

CODE QUALITY

────────────────────────────────────────

Follow clean architecture.

Suggested structure:

src/

assets/

components/

pages/

services/

hooks/

context/

utils/

constants/

routes/

supabase/

App.jsx

main.jsx

Requirements:

• Reusable Components

• Modular Architecture

• Service Layer

• Utility Functions

• React Hooks

• Clean Naming

• Maintainable Code

• Scalable Folder Structure

Avoid duplicate code.

────────────────────────────────────────

SECURITY

────────────────────────────────────────

Use:

• Supabase Authentication

• Protected Routes

• Environment Variables

• HTTPS

• Input Validation

• Secure Database Policies

────────────────────────────────────────

PERFORMANCE

────────────────────────────────────────

Optimize:

• Fast Loading

• Lazy Loading

• Efficient Rendering

• Minimal Re-renders

• Optimized Queries

• Smooth Animations

────────────────────────────────────────

ACCESSIBILITY

────────────────────────────────────────

Ensure:

• Large Touch Targets

• Readable Typography

• Keyboard Navigation

• Screen Reader Support

• High Contrast

• Accessible Forms

────────────────────────────────────────

RESPONSIVE DESIGN

────────────────────────────────────────

Support:

• Mobile

• Tablet

• Desktop

Maintain consistent spacing across all screen sizes.

────────────────────────────────────────

ANIMATIONS

────────────────────────────────────────

Use subtle premium animations.

Examples:

• Fade

• Slide

• Scale

• Progress Animation

• Chart Animation

• Button Ripple

• Skeleton Loading

• Micro Interactions

Avoid excessive animation.

────────────────────────────────────────

DELIVERABLES

────────────────────────────────────────

Generate a complete production-ready application including:

• Complete React.js project

• Premium responsive UI

• Supabase integration

• Authentication

• Database schema

• CRUD operations

• Dashboard

• Income management

• Expense management

• Savings jars

• Goals

• Analytics

• Notifications

• Proper folder structure

• Vercel deployment readiness

────────────────────────────────────────

WORKFLOW

────────────────────────────────────────

Implement the project in this order:

1. Read and understand SOP, PRD, TSD, and DSD.

2. Create project architecture.

3. Configure Supabase.

4. Design database schema.

5. Build authentication.

6. Create reusable UI components.

7. Build Dashboard.

8. Implement Income module.

9. Implement Expense module.

10. Implement Savings Jars.

11. Implement Goals.

12. Build Analytics.

13. Build Profile & Settings.

14. Add Notifications.

15. Test all features.

16. Optimize performance.

17. Prepare for deployment.

Complete each phase before moving to the next.

Throughout development, prioritize clean architecture, scalability, accessibility, security, performance, and a premium user experience. Every decision must align with the attached SOP, PRD, TSD, and DSD. If any requirement is unclear, ask for clarification before proceeding.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/712ef7bf-9b23-40cf-9df7-71bdb8e3dd6e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
