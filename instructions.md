Project Constitution: Primes SMS
This document provides a complete set of instructions for building the "Primes SMS" SaaS application. As an AI development assistant, you must adhere strictly to these guidelines for all generated code, components, and architecture.

1. Core Mission & Vision
Product: Primes SMS
Mission: To provide a developer-friendly and transparent WhatsApp Business API platform for SMBs and startups.
Core Principles:

Simplicity: The UI must be exceptionally clean, intuitive, and seamless. Avoid clutter.

Transparency: The credit-based, pay-per-use model should be clear and upfront. No hidden fees.

Power: Provide robust features for both UI-driven campaign management and API-driven integrations.

Responsiveness: The application must be fully responsive and performant on all devices.

2. Technology Stack & Architecture
Frontend: React (Vite) with TypeScript.

Styling: Tailwind CSS.

UI Components: Shadcn/ui. You must use these components wherever possible (e.g., Button, Input, Card, Table, Select, Dialog).

Backend: Node.js with Express.js and TypeScript.

Database: PostgreSQL.

Authentication: JWT (JSON Web Tokens) for securing API endpoints.

3. Roles and Permissions Model
There are two primary roles in this system.

User (Customer):

Can access their own dashboard.

Can manage their own campaigns, templates, and API keys.

Can view their own reports and profile.

Can purchase and see their credit balance.

CANNOT see other users' data or any admin-level information.

CANNOT see their own sensitive Meta credentials (Phone Number ID, Access Token).

Admin (You/Platform Owner):

Full CRUD access to all User accounts.

Can view and manage all users in a central dashboard.

Can securely add/update the sensitive Meta credentials for each user.

Can manually add or deduct credits from any user's account.

Has access to all system-wide data.

4. Feature Set: User Dashboard
4.1. Quick Send Campaign
Goal: Allow users to quickly send a single template message to a bulk list of numbers.

Frontend (QuickSendCampaign.tsx):

Use a <Card> component as the container.

Template Selection: Use a <Select> component to list the user's approved templates (fetched from the backend).

Recipient Numbers: Use a <Textarea> for users to paste phone numbers. Accept comma-separated or newline-separated values.

Variable Inputs: When a template is selected, dynamically render <Input> fields for each variable found in the template string (e.g., {{1}}, {{2}}).

Action: A <Button> labeled "Send Campaign". On click, parse numbers, validate inputs, and send the data to the backend API. Show a loading state on the button during the request.

Backend (/api/campaigns/quick-send - POST):

Protected route, requires user authentication.

Receives template_id, recipient_numbers[], and variables[].

Retrieves the user's credentials from the database.

For each number, deduct the appropriate credit amount and call the Meta API to send the message.

Log each message attempt in the reports table.

4.2. Customized SMS Campaign
Goal: Allow users to send personalized messages by mapping spreadsheet columns to template variables.

Frontend (CustomizedCampaign.tsx):

A multi-step wizard UI. Use a simple step indicator.

Step 1: Upload: An input for uploading an Excel (.xlsx) or CSV (.csv) file. Use a library like xlsx or papaparse to parse the file on the client side. Display a preview of the first few rows in a <Table>.

Step 2: Map Columns:

A <Select> to choose the WhatsApp template.

A <Select> to identify which column contains the phone numbers.

Dynamically render mapping selectors: for each variable in the template (e.g., "Variable {{1}}"), provide a <Select> populated with the column headers from the uploaded sheet.

Step 3: Confirm & Send: Show a summary (e.g., "You are about to send the 'Welcome' template to 150 contacts."). A <Button> labeled "Confirm & Send Campaign".

Backend (/api/campaigns/customized-send - POST):

Protected route.

Receives template_id and an array of objects, where each object is { phone_number: '...', variables: ['val1', 'val2'] }.

Perform the same logic as the quick-send: retrieve credentials, loop through recipients, deduct credits, call Meta API, log report.

4.3. Manage Templates
Goal: A full CRUD interface for managing WhatsApp message templates.

Frontend (ManageTemplates.tsx):

Display all of the user's templates in a <Table> with columns: Name, Category, Status (e.g., Approved, Pending, Rejected), and Actions.

The Status column should use a <Badge> component from Shadcn/ui with different colors.

Actions column should have buttons (<Button variant="ghost">) for Edit and Delete.

A main <Button> labeled "Create New Template" which opens a <Dialog>.

Create/Edit Dialog: A form with fields for name, category, language, and the template body header, body, and footer.

Backend (router: /api/templates):

GET /: Fetches all templates for the authenticated user from Meta's API.

POST /: Receives template data and calls the Meta API to create a new template.

PUT /:template_id: Receives updated data and calls the Meta API to edit.

DELETE /:template_name: Receives a template name and calls the Meta API to delete it.

4.4. Manage API
Goal: Allow developers to generate and manage API keys for integration.

Frontend (ManageApi.tsx):

Display the user's current API key(s) in a list or table. The key itself should be partially masked for security, with a "Copy" button.

Buttons to "Generate New Key" and "Revoke" an existing key.

A sub-section or tab for API Documentation. This should be a static but well-formatted display of available endpoints (like the ones you are building), request/response examples, and authentication instructions. Use code blocks for clarity.

Backend (router: /api/keys):

GET /: Get all active keys for the user.

POST /: Generate a new, secure, random API key, store its hash in the DB, and return the key to the user one time.

DELETE /:key_id: Revoke an API key.

4.5. Manage Reports
Goal: Provide detailed analytics on all sent messages.

Frontend (Reports.tsx):

Use <Card> components to show key stats: Total Sent, Delivered, Read, Failed.

Use a <Table> to list all campaigns/messages. Columns: Campaign Name/API, Date, Recipients, Status, Cost (in credits).

Filters: Provide <Select> or <DatePicker> components to filter the table by Date Range, Campaign Type (API vs. Panel), and Status.

Backend (router: /api/reports):

GET /: A powerful endpoint that accepts query parameters for filtering (?startDate=..., ?type=...). It should fetch and paginate data from the reports table for the authenticated user.

4.6. Other User Features
Credit System & Profile:

A section in the UI, always visible, showing "Credits: 5,432".

A Profile or Billing page where users can see their details and purchase more credits (initially, this can be a simple form that sends a request to the admin).

Chatbot / Feature Request:

This is not a real chatbot. It's a simple form.

Use a <Dialog> triggered by a "Request a Feature" button.

The form should contain a <Textarea> for the feature description and an optional <Input> for contact details.

Submitting the form sends an email to the admin or stores the request in a database table.

5. Feature Set: Admin Dashboard
This is a separate section of the app, likely at a /admin route, protected by an Admin role check.

User Management:

UI: A <Table> listing all users registered on the platform. Columns: Name, Email, Company, Credit Balance, Date Joined.

Each row must have an Edit button that opens a <Dialog> or navigates to a user detail page.

Edit Dialog: Admin can update user details. Critically, this is where the admin will input the user's Meta Credentials (phone_number_id, waba_id, access_token). These fields must be treated like passwords.

Credit Management: Inside the edit dialog, include an input to Add/Deduct Credits and a "Reason" field. This creates an audit trail.

Backend:

All /api/admin/* routes must be protected and verify the user has the Admin role.

Provide full CRUD endpoints for managing users and their associated data.

When updating Meta credentials, ensure they are encrypted before being stored.

6. Database Schema (PostgreSQL)
Create tables with these columns. Use UUIDs for primary keys.

users:

id (PK, uuid)

name (varchar)

email (varchar, unique)

password_hash (varchar)

role (enum: 'user', 'admin')

credit_balance (integer, default: 0)

created_at (timestamp)

meta_credentials:

id (PK, uuid)

user_id (FK to users.id, unique)

phone_number_id (varchar, encrypted)

waba_id (varchar, encrypted)

access_token (varchar, encrypted)

api_keys:

id (PK, uuid)

user_id (FK to users.id)

key_hash (varchar)

prefix (varchar)

created_at (timestamp)

reports:

id (PK, uuid)

user_id (FK to users.id)

campaign_name (varchar)

source (enum: 'panel', 'api')

status (enum: 'sent', 'delivered', 'read', 'failed')

error_message (text, nullable)

credit_cost (integer)

created_at (timestamp)

7. General Instructions & Best Practices
Error Handling: Implement robust error handling on both the frontend and backend. The backend should return clear JSON error messages (e.g., { "error": "Insufficient credits" }). The frontend should display these errors to the user using Sonner or Toaster from Shadcn/ui.

Security:

Hash and salt user passwords.

Encrypt all sensitive Meta credentials at rest.

Implement proper authorization checks on every API endpoint. A user must never be able to access another user's data.

Use environment variables (.env) for all secrets and keys. DO NOT commit them to Git.

Code Quality:

Write clean, modular, and reusable code.

On the frontend, break down features into smaller, manageable components.

On the backend, use a service/controller/route structure.

Use TypeScript consistently and avoid any where possible.

Final Command: When I ask you to build a feature, refer back to the relevant section of this document and build it exactly as specified. Ask for clarification if a requirement is ambiguous.