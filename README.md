
## Project Overview

This project provides an **E-Commerce Sales Dashboard** that displays various statistics, charts, and transaction details from an online store. The backend handles data aggregation and statistics, while the frontend displays interactive charts and tables. It uses APIs for fetching statistics like the total sale amount, sold and unsold items, price ranges, and category-wise data for selected months.

---

## Project Structure

### 1. Backend

- **Technologies**: Node.js, Express, MongoDB (with Mongoose)
- **Endpoints**:
  - **/transactions**: Fetch transactions for the selected month, including pagination and search functionality.
  - **/statistics**: Fetch the total sale amount, total sold items, and total unsold items for the selected month.
  - **/bar-chart**: Fetch bar chart data showing the number of items in various price ranges for the selected month.
  - **/pie-chart**: Fetch pie chart data showing the number of items per category for the selected month.
  - **/combinedAPI**: Combine statistics, bar chart, and pie chart data into a single response.

### 2. Frontend
- **Technologies**: HTML, CSS, JavaScript (with Fetch API for AJAX calls)
- **Features**:
  - **Transaction Table**: Displays transactions for a selected month, with search and pagination features.
  - **Statistics Section**: Displays total sale amount, total sold items, and total unsold items.
  - **Bar Chart**: Shows the number of items in different price ranges for the selected month.
  - **Pie Chart**: Displays the number of items for each category.

---

## How to Access the Project

### 1. Clone the repository
To clone the project, run:

git clone: https://github.com/dhirajdurande13/Backend-task
