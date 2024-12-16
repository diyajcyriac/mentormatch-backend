# Mentorship Matching Platform - Frontend

## Description

The frontend for the Mentorship Matching Platform connects mentors and mentees through a seamless user interface. It allows users to sign up, create profiles, browse others, and find matches using a smart matchmaking algorithm.

## Live Application

Access the deployed frontend application: https://mentormatch-frontend.onrender.com/

## Setup Instructions

### Prerequisites

Ensure the following tools are installed on your system:

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/diyajcyriac/mentormatch-frontend.git
    cd mentormatch-frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following content:

    ```env
    REACT_APP_BACKEND_URL=https://mentormatch-backend-y3wu.onrender.com
    ```

4. Run the application:

   **Development Mode:**

    ```bash
    npm start
    # or
    yarn start
    ```

   **Production Build:**

    ```bash
    npm run build
    npm serve
    ```

### Technologies Used

- Frontend Framework: React.js
- State Management: React Context API
- Styling: CSS3, Responsive Design

### Features

- **User Interface**
- **User Registration and Login**: Secure login and registration with input validation.
- **Profile Setup**: Create and edit user profiles with role, skills, and interests.
- **User Discovery**: Browse and filter profiles based on role, skills, and interests.
- **Responsive Design**: Fully functional across all devices and screen sizes.

### Deployment

The frontend is hosted on Render. Ensure to set the environment variables in the Render dashboard for a smooth deployment.


