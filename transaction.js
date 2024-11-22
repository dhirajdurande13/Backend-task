document.addEventListener("DOMContentLoaded", () => {
    const monthSelect = document.getElementById("month");
    const searchInput = document.getElementById("search");
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const transactionsTableBody = document.querySelector("#transactions-table tbody");
  
    let currentPage = 1;
    const perPage = 10;
    let searchQuery = "";
  
    
    const fetchTransactions = async () => {
      const month = monthSelect.value;
      const url = `http://localhost:5500/transactions?month=${month}&page=${currentPage}&perPage=${perPage}&search=${searchQuery}`;
       // console.log(url);
      try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        const data = await response.json();
        console.log(data);
        updateTable(data.transactions);
        updatePagination(data.page, data.total, data.perPage);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
  
    // Update table rows
    const updateTable = (transactions) => {
      transactionsTableBody.innerHTML = "";
      transactions.forEach(transaction => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${transaction.id}</td>
          <td>${transaction.title}</td>
          <td>${transaction.price}</td>
          <td>${transaction.category}</td>
          <td>${transaction.sold ? "Yes" : "No"}</td>
          <td>${new Date(transaction.dateOfSale).toLocaleDateString()}</td>
        `;
        transactionsTableBody.appendChild(row);
      });
    };
  
    // Update pagination buttons
    const updatePagination = (currentPage, total, perPage) => {
      const totalPages = Math.ceil(total / perPage);
      prevButton.disabled = currentPage <= 1;
      nextButton.disabled = currentPage >= totalPages;
    };
  
    // Handle month change
    monthSelect.addEventListener("change", () => {
      currentPage = 1;
      fetchTransactions();
    });
  
    // Handle search input
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      fetchTransactions();
    });
  
    // Handle previous page
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchTransactions();
      }
    });
  
    // Handle next page
    nextButton.addEventListener("click", () => {
      currentPage++;
      fetchTransactions();
    });
  
    // Initial load
    fetchTransactions();
  });
  