# Mentorship Matching Platform - Backend

## Description

The backend for the Mentorship Matching Platform provides the core functionality to manage user authentication, profiles, matchmaking, and mentorship requests. It interacts with the database and serves APIs to the frontend.

## Live Application

Access the deployed backend application here : https://mentormatch-frontend.onrender.com/


## Setup Instructions

### Prerequisites

Ensure the following tools are installed on your system:

- Node.js (v14+)
- npm or yarn
- MongoDB account

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/diyajcyriac/mentormatch-backend.git
    cd mentormatch-backend
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3. Set up the database:
   Create a database named `mentorship_platform`.

4. Run database migrations:

    ```bash
    npm run migrate
    # or
    yarn migrate
    ```

5. Configure environment variables:
   Create a `.env` file in the root directory with the following content:

    ```env
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/
    JWT_SECRET=<your_jwt_secret>
    CORS_ORIGIN=https://mentormatch-frontend.onrender.com
    ```

   Replace `<username>`, `<password>`, and `<your_jwt_secret>` with your actual values.

6. Run the application:

   **Development Mode:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

   **Production Build:**

    ```bash
    npm run build
    npm start
    ```

### Technologies Used

- Backend Framework: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Hosting: Render

### Features

- **Core Functionalities**
  - **User Authentication**: Secure registration, login, and logout.
  - **Profile Management**: Create, edit, and delete profiles.
  - **Matchmaking Algorithm**: Matches users based on shared skills and interests.
  - **Mentorship Requests**: Send requests, and accept or decline mentorship offers.

- **Additional Features**
  - **Edge Case Handling**: Validates inputs and provides alternative suggestions if no matches are found.
  - **Scalable Architecture**: Designed to handle increased user traffic.

### Deployment

The backend is hosted on Render. Ensure to configure the environment variables (`MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGIN`) securely in the Render dashboard.

### Contribution

Feel free to raise issues or submit pull requests to improve the project.