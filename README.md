# PA4: Project Management and User Stories

## Overview

This full-stack application extends PA3 project management with user stories and a separate backlog for each project. Users can register, log in, create projects, manage project membership, and create, edit, assign, and delete user stories.

The application stores story descriptions and tracks their progress. It does not implement or automatically verify the features described by those stories.

## Technologies

- React and Vite
- JavaScript
- Node.js and Express
- MongoDB with the native Node.js driver
- bcryptjs for password hashing
- dotenv for environment configuration
- CORS
- Fetch API for communication between React and Express

## Features

### Accounts and projects

- Register accounts with unique usernames and hashed passwords.
- Verify login credentials.
- Create and view projects.
- Set project status to Planning, Active, or Completed.
- Automatically add the Project Lead as a project member.
- Add registered users to projects.
- Reject duplicate memberships and removal of a Project Lead.

### User stories and backlogs

- Create stories with a title, description, priority, and optional assignment.
- Automatically give new stories the status To Do on the backend.
- View only the selected project's stories, including Done stories.
- Display titles, priorities, statuses, and readable assignee names.
- Expand a story's description.
- Edit existing stories or cancel without saving.
- Change between To Do, In Progress, and Done, including reopening Done stories.
- Delete stories after confirmation.
- Clear editing state and story details when switching projects.
- Persist changes in MongoDB across page refreshes.

### Assignment rules

- A story is Unassigned or assigned to one current member of its project.
- The assignment dropdown includes only that project's members, including its lead.
- The backend checks that the assigned user exists and belongs to the project.
- A member cannot be removed while any stories in that project are assigned to them, including Done stories.
- Assignments in another project do not block removal.
- Stories must be reassigned, unassigned, or deleted before removing their assigned member.

## Project Structure

| Path | Purpose |
| --- | --- |
| `client/` | React/Vite frontend |
| `client/src/App.jsx` | Shared data and selected project |
| `client/src/components/` | Account, project, membership, and backlog interfaces |
| `client/src/components/ProjectBacklog.jsx` | Story forms, backlog, and story requests |
| `server/server.js` | Express routes, validation, and MongoDB connection |
| `server/.env` | Private MongoDB connection configuration; excluded from Git |
| `README.md` | Setup and testing instructions |

## Prerequisites

- Node.js and npm
- A running local MongoDB instance or an accessible MongoDB Atlas deployment
- Git, if cloning the repository

For Atlas, configure database credentials and network access so the computer running Express can connect.

## Installation

Clone the repository using its GitHub URL, then open a terminal in the repository root.

Install backend dependencies:

```powershell
cd server
npm install
```

Install frontend dependencies:

```powershell
cd ..\client
npm install
```

## Configuration

Create a file named `.env` inside `server/`:

```env
MONGO_URI=your_connection_string
```

Replace the placeholder with your MongoDB connection string.

The backend explicitly uses the `pa2` database so existing PA2 and PA3 data can be reused.

Do not commit real connection strings or credentials.

## Run the Application

### Backend

From the repository root:

```powershell
cd server
node server.js
```

Expected output includes:

```text
Connected to MongoDB
Server running at http://localhost:9000
```

### Frontend

Open a second terminal at the repository root:

```powershell
cd client
npm run dev
```

Open the Local URL printed by Vite, normally:

```text
http://localhost:5173
```

If that port is occupied, use the actual URL printed by Vite.

Keep both terminals running while using the application.

## Database

Database name: `pa2`

| Collection | Purpose |
| --- | --- |
| `users` | Registered users and password hashes |
| `projects` | Project information and Project Lead references |
| `projectMemberships` | Relationships between users and projects |
| `userStories` | Story information, status, and assignment |

Each story stores:

| Field | Type and meaning |
| --- | --- |
| `_id` | MongoDB-generated ObjectId |
| `project_id` | ObjectId referencing the original project |
| `title` | Nonblank string |
| `description` | Nonblank story description |
| `priority` | High, Medium, or Low |
| `status` | To Do, In Progress, or Done |
| `assigned_user_id` | ObjectId referencing a project member, or null |

The project relationship cannot be changed through story editing.

Use this description format:

> As a [type of user], I want [goal], so that [benefit].

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/signup` | Register a user |
| POST | `/login` | Verify login credentials |
| GET | `/api/users` | List users without password hashes |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:projectId/members` | List memberships |
| POST | `/api/projects/:projectId/members` | Add a member |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove an eligible non-lead member |
| GET | `/api/projects/:projectId/stories` | List a project's stories |
| POST | `/api/projects/:projectId/stories` | Create a story |
| PUT | `/api/projects/:projectId/stories/:storyId` | Update a story |
| DELETE | `/api/projects/:projectId/stories/:storyId` | Delete a story |

React sends JSON requests to Express using fetch. Express validates requests and reads or updates MongoDB, then returns JSON responses.

Story updates and deletions match both `_id` and `project_id`. Updates use an explicit set of editable fields and preserve the document's identity and project relationship.

Login verifies credentials; the application does not implement session or token-based route authorization.

## Prepare Demonstration Data

MongoDB documents are not included when this repository is pushed or cloned. Prepare the following data through the application.

### 1. Register three users

Use the Signup form to create these demonstration accounts, or reuse equivalent existing accounts:

| First name | Last name | Username |
| --- | --- | --- |
| Gordon | Ramsay | `gordonramsay` |
| Dolly | Parton | `dollyparton` |
| Alex | Taylor | `alextaylor` |

Choose passwords locally. Do not publish passwords in the repository.

If a username already exists, reuse that account or choose another unique username.

### 2. Create two projects

| Project | Description | Status | Project Lead |
| --- | --- | --- | --- |
| Gordon Ramsay's Cloud Kitchen | Online recipes and cooking instructions | Planning | Gordon Ramsay |
| Dolly's 9-5 Scheduler | Daily task and schedule planning | Active | Dolly Parton |

Each lead automatically becomes a member.

Select Gordon's project and add Alex as a non-lead member. Initially, do not add Alex to Dolly's project.

The existing View Members button selects the project for both membership management and its backlog.

### 3. Create at least five stories

All new stories start as To Do. After creation, use Edit to set the statuses listed below.

| Project | Title | Priority | Status | Assigned member |
| --- | --- | --- | --- | --- |
| Gordon | View recipe instructions | High | To Do | Unassigned |
| Gordon | Search recipes | Medium | In Progress | Gordon |
| Gordon | Save favorite recipes | Low | Done | Unassigned |
| Dolly | View daily schedule | High | To Do | Dolly |
| Dolly | Reschedule a task | Medium | In Progress | Unassigned |

Use these descriptions:

- **View recipe instructions:** As a home cook, I want to view recipe instructions, so that I can prepare a meal correctly.
- **Search recipes:** As a home cook, I want to search recipes by ingredient, so that I can use ingredients I already have.
- **Save favorite recipes:** As a registered user, I want to save favorite recipes, so that I can find them again.
- **View daily schedule:** As a busy user, I want to view my daily schedule, so that I can organize my workday.
- **Reschedule a task:** As a busy user, I want to change a task's time, so that I can adjust to changes in my day.

## Manual Testing

### Story creation and persistence

1. Select Gordon's project.
2. Create a story with a valid title, description, and priority.
3. Leave it Unassigned.
4. Confirm it appears with status To Do.
5. Refresh the page and reselect the project.
6. Confirm the story remains.

### Validation

1. Enter only spaces in a story title and submit otherwise valid fields.
2. Confirm submission is rejected.
3. Confirm the assignment dropdown contains only current project members.
4. Test the backend directly with invalid priorities, invalid statuses, malformed IDs, nonexistent assignees, and users outside the project.
5. Confirm rejected requests do not save changes.

### Editing and project switching

1. Open a story's Description.
2. Click Edit and confirm existing values populate the form.
3. Change values and click Cancel.
4. Confirm the saved story remains unchanged.
5. Edit and save changes to its title, description, priority, status, and assignment.
6. Change its status to Done, then reopen it as To Do or In Progress.
7. Confirm Done stories remain visible.
8. Open an edit form, then switch projects.
9. Confirm the old form and details clear and only the new project's stories appear.
10. Save unchanged values and confirm the operation succeeds.

### Member-removal rules

1. Assign a story in Gordon's project to Alex.
2. Mark the story Done.
3. Attempt to remove Alex from Gordon's project.
4. Confirm removal is blocked with an explanation.
5. Unassign, reassign, or delete all of Alex's stories in Gordon's project.
6. Confirm removal now succeeds.
7. Confirm Alex disappears from the assignment dropdown.
8. Confirm the Project Lead cannot be removed.

To test isolation between projects:

1. Add Alex to both projects.
2. Assign Alex a story in Gordon's project only.
3. Remove Alex from Dolly's project.
4. Confirm removal succeeds because the assignment belongs to Gordon's project.

### Deletion and project boundaries

1. Click Delete on a temporary story and cancel.
2. Confirm the story remains.
3. Delete it again and confirm.
4. Refresh and reselect the project.
5. Confirm the deleted story remains absent.
6. Send edit and delete requests using a story ID from one project with the other project's URL.
7. Confirm the requests fail and the original story is unchanged.

### PA3 regression checks

- Signup and Login still work.
- Projects can be created and viewed.
- Leads automatically appear as members.
- Non-lead members can be added and removed when eligible.
- Duplicate memberships are rejected.
- Project Lead removal is rejected.

## Git Exclusions

Keep these entries in the root `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
```

Commit source files, package manifests, and package lock files.

Git ignore rules do not automatically stop tracking files that were committed previously. Verify that credentials and dependency folders are not tracked before pushing.

## Demonstration and Submission

Record a 3–5 minute Zoom demonstration showing:

- Creating and assigning a story.
- Switching between two project backlogs.
- Editing, changing status, and reassigning or unassigning a story.
- Deleting with confirmation and refreshing to show persistence.
- A validation failure.
- Blocked removal of a member with assigned stories.
- MongoDB story documents and their ObjectId references.
- A brief explanation of React requests, Express routes, scoped updates, and membership validation.

Commit and push the final source code and README. Verify the repository on GitHub, then submit the repository URL and Zoom demonstration through Brightspace.