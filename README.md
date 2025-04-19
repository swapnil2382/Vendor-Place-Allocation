# Vendor Place Allocation System

## Overview

The **Vendor Place Allocation System** is a web application designed to streamline the process of allocating places for vendors at weekly markets. The system allows vendors to request spaces, with an approval process that verifies their government-issued business licenses. This platform ensures better sales for vendors by managing congestion and providing transparent communication between vendors and the admin. The system also manages vendor registration and approval, as well as commission handling by the government.

## Features

- **Vendor Registration**: Vendors can register for the system with necessary details.
- **Place Allocation**: Admins can allocate spots for vendors in the market based on availability.
- **License Verification**: Vendors' licenses are verified through an automated process before allocation.
- **Admin Dashboard**: Admin can approve or reject vendor applications, allocate spaces, and manage the market.
- **Vendor Dashboard**: Vendors can view available spaces, apply for allocation, and track approvals.
- **Commission Handling**: All transactions between vendors and government for space allocation are tracked.
- **Notifications**: Vendors receive email/SMS notifications regarding the status of their applications.

## Tech Stack

- **Frontend**: React.js, HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL for relational data management
- **Authentication**: JWT (JSON Web Token) for secure authentication
- **License Verification**: Custom API integration for government license checks
- **Deployment**: Heroku (Frontend) & DigitalOcean (Backend)

## Installation

### Prerequisites

Before you begin, ensure that you have the following installed:

- Node.js (for both frontend and backend)
- MySQL (or use a MySQL cloud service)
- Git
- A code editor (VSCode is recommended)

### Steps

1. Clone this repository:

   ```bash
   git clone https://github.com/swapnil2382/Vendor-Place-Allocation.git
   ```

2. Install dependencies for the **backend**:

   Navigate to the `backend` directory:

   ```bash
   cd backend
   ```

   Then, install the required packages:

   ```bash
   npm install
   ```

3. Set up the **frontend**:

   Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

   Then, install the required packages:

   ```bash
   npm install
   ```

4. **Environment Variables**:  
   Create a `.env` file in both the backend and frontend directories to store your environment variables (like database credentials, JWT secret, etc.). The `.env` file should contain:

   ```
   DATABASE_URL=<Your-Database-URL>
   JWT_SECRET=<Your-JWT-Secret>
   ```

5. **Run the Application**:

   For **backend**:

   ```bash
   cd backend
   npm start
   ```

   For **frontend**:

   ```bash
   cd frontend
   npm start
   ```

   Open your browser and visit `http://localhost:3000` to view the application.

## Usage

- **Admin Usage**: Admin users can log into the admin panel and manage the vendor place allocations. They can approve or reject vendor applications, verify licenses, and allocate spaces.
  
- **Vendor Usage**: Vendors can log in to apply for available spaces and check the status of their applications. Once approved, they can view their spot allocations.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project. All contributions are welcome!

1. Fork the repository.
2. Create your branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## Acknowledgements

- Thanks to the open-source community for providing libraries and tools that help accelerate development.
- Special thanks to the **Node.js** and **React** teams for their excellent frameworks.
  
---

**Owner**: [Swapnil2382](https://github.com/swapnil2382)

```

