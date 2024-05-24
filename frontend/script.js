// Global variables to manage file data and pagination
let result = {};
let filteredData = {};
let currentPage = 1;
const limit = 100;
let totalPages = 1;
let files = [];
let filteredFilesData = [];
let sortBy = null;
let sortOrder = null;
let deletingId = null;
// const MAIN_URL = "http://localhost:8000/api/v1";
const MAIN_URL = "https://ninjas-csv-upload.vercel.app/api/v1";
const alertMsgColorCode = {
  SUCCESS: "#2E7D32",
  WARNING: "#ED6C02",
  INFO: "#0288D1",
  ERROR: "#D32F2F",
};

// Columns definition for the file list table
const fileListTableColumns = [
  { label: "Filename", value: "fileName" },
  { label: "Uploaded At", value: "uploadedAt" },
  { label: "Rows", value: "rows" },
  { label: "id", value: "id", hide: true },
];

// DOM elements
const paginationContainer = document.getElementById("pagination-container");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("csv-file");
const removeTableIcon = document.getElementById("remove-table");
const searchInput = document.getElementById("search-input");
const searchFileInput = document.getElementById("search-file-input");
const headingUploadBtn = document.getElementById("heading-upload-btn");
const closePopupIcon = document.getElementById("close-popup");
const deleteButton = document.getElementById("delete-button");
const uploadForm = document.getElementById("upload-form");
const cancelButton = document.getElementById("cancel-button");
const selectedFileNameSection = document.getElementById("selected-file-name");
const container = document.getElementsByClassName("container")[0];
const confirmPopupContainer = document.getElementsByClassName(
  "confirm-popup-container"
)[0];

uploadBtn.disabled = true;

// Event listeners
closePopupIcon.addEventListener("click", () => {
  container.style.display = "none";
  fileInput.value = "";
  selectedFileNameSection.innerHTML = "";
});

uploadForm.addEventListener("drop", (event) => {
  event.preventDefault();
  fileInput.files = event.dataTransfer.files;
  const file = fileInput.files[0];
  if (file && file.name.endsWith(".csv")) {
    uploadBtn.disabled = false;
  }

  const crossIcon = document.createElement("i");
  crossIcon.className = "fa-solid fa-xmark unselect-icon";
  crossIcon.id = "unselect-icon";
  crossIcon.addEventListener("click", () => {
    selectedFileNameSection.innerHTML = "";
    fileInput.value = "";
    uploadBtn.disabled = true;
  });
  if (selectedFileNameSection) {
    selectedFileNameSection.innerHTML = `${file.name}`;
    selectedFileNameSection.appendChild(crossIcon);
  }
});

uploadForm.addEventListener("dragover", (event) => {
  event.preventDefault();
});

deleteButton.addEventListener("click", async () => {
  showLoadingOverlay(true);
  try {
    if (deletingId !== null) {
      await fetch(`${MAIN_URL}/file/${deletingId}`, {
        method: "DELETE",
      });
      files = files.filter((file) => file.id !== deletingId);
      filteredFilesData = filteredFilesData.filter(
        (file) => file.id !== deletingId
      );
      deletingId = null;
      confirmPopupContainer.style.display = "none";
      confirmPopupContainer.style.width = "0";
      populateFileListTable(filteredFilesData);
      showNotification("File successfully deleted", "SUCCESS");
    }
  } catch (error) {
    showNotification(error.message, "ERROR");
  }
  showLoadingOverlay(false);
});

cancelButton.addEventListener("click", () => {
  deletingId = null;
  confirmPopupContainer.style.display = "none";
  confirmPopupContainer.style.width = "0";
});

function openConfirmPopup() {
  confirmPopupContainer.style.display = "flex";
  confirmPopupContainer.style.width = "100%";
}

headingUploadBtn.addEventListener("click", () => {
  openUploadPopup();
});

function customSort(a, b) {
  if (sortBy !== null) {
    if (sortOrder) {
      return a[sortBy] < b[sortBy] ? -1 : 1;
    } else {
      return a[sortBy] > b[sortBy] ? -1 : 1;
    }
  }
}

// Load initial data when the page loads
document.addEventListener("DOMContentLoaded", onLoad);

searchInput.addEventListener("input", onHandleChange);
searchFileInput.addEventListener("input", onHandleChangeFileInput);

removeTableIcon.addEventListener("click", () => {
  resetToFileListView();
  document.getElementById("heading").style.display = "flex";
  paginationContainer.style.display = "none";
});

fileInput.addEventListener("change", onFileInputChange);

uploadBtn.addEventListener("click", (event) => {
  event.preventDefault();
  uploadFile();
});

// Load file list data from the server
async function onLoad() {
  showLoadingOverlay(true);
  try {
    const response = await fetch(`${MAIN_URL}/files`);
    const data = await response.json();

    files = JSON.parse(JSON.stringify(data));
    filteredFilesData = JSON.parse(JSON.stringify(data));
    populateFileListTable(filteredFilesData);
  } catch (error) {
    console.error("Error loading files:", error);
  }
  showLoadingOverlay(false);
}

function showNotification(
  msg = "This is a sample msg",
  type = "SUCCESS",
  timer = 3000
) {
  const alertElement = document.querySelector(".alert");
  const msgContainer = document.querySelector(".msg");
  alertElement.style.background =
    alertMsgColorCode[type] || alertMsgColorCode["INFO"];
  alertElement.style.borderColor =
    alertMsgColorCode[type] || alertMsgColorCode["INFO"];
  msgContainer.textContent = msg;
  alertElement.classList.add("show");
  alertElement.classList.remove("hide");
  alertElement.classList.add("showAlert");

  setTimeout(function () {
    alertElement.classList.remove("show");
    alertElement.classList.add("hide");
    alertElement.classList.remove("showAlert");
  }, timer);
}

document.querySelector(".close-btn").addEventListener("click", function () {
  let alertElement = document.querySelector(".alert");
  alertElement.classList.remove("show");
  alertElement.classList.add("hide");
});

// Populate the file list table with data
function populateFileListTable(rows) {
  const tableHeadersRow = document.getElementById("file-list-headers");
  const tableBody = document.getElementById("file-list-body");
  tableHeadersRow.innerHTML = "";
  tableBody.innerHTML = "";

  // Populate table headers
  fileListTableColumns.forEach((column) => {
    const th = document.createElement("th");
    if (column.hide) {
      th.style.display = "none";
    }
    th.innerText = column.label;
    tableHeadersRow.appendChild(th);
  });

  const th = document.createElement("th");
  th.innerText = "Actions";
  tableHeadersRow.appendChild(th);

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const img = document.createElement("img");
    img.src =
      "https://cdni.iconscout.com/illustration/premium/thumb/young-lady-with-no-data-10962328-8881952.png";
    img.style.width = "200px";
    img.style.height = "200px";
    // td.style.display = "flex";
    // td.style.justifyContent = "center";
    td.appendChild(img);
    td.style.height = "200px";
    td.colSpan = fileListTableColumns.length;
    td.style.textAlign = "center";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  } else {
    rows.forEach((rowData) => {
      const tr = document.createElement("tr");
      fileListTableColumns.forEach((column) => {
        const td = document.createElement("td");
        if (column.hide) {
          td.style.display = "none";
        }
        if (column.value === "fileName") {
          const fileIcon = document.createElement("i");
          fileIcon.className = "fa-regular fa-file fileIcon";
          td.appendChild(fileIcon);
        }
        td.append(rowData[column.value]);
        tr.appendChild(td);
      });

      const td = document.createElement("td");
      const eyeIcon = document.createElement("i");
      const deleteIcon = document.createElement("i");
      eyeIcon.className = "fa-solid fa-eye eye-icon";
      deleteIcon.className = "fa-solid fa-trash delete-icon";
      deleteIcon.addEventListener("click", () => {
        deletingId = rowData.id;
        openConfirmPopup();
      });
      td.appendChild(eyeIcon);
      td.appendChild(deleteIcon);

      eyeIcon.addEventListener("click", async () => {
        paginationContainer.style.display = "flex";
        await viewFileData(rowData.id);
      });

      tr.appendChild(td);
      tableBody.appendChild(tr);
    });
  }

  // Populate table rows
}

// Display the upload popup
function openUploadPopup() {
  container.style.display = "flex";
  container.style.top = "0";
  container.style.left = "0";
  container.style.backgroundColor = "rgba(0,0,0,0.7)";
  container.style.width = "100%";
  container.style.height = "100%";
  const uploadForm = document.getElementById("form-container");
  uploadForm.style.width = "500px";
  uploadForm.style.padding = "20px";
  uploadForm.style.margin = "auto";
  uploadForm.style.backgroundColor = "white";
}

// Handle changes in the search input to filter table data
function onHandleChange(event) {
  const arr = JSON.parse(JSON.stringify(result.rows));
  if (!event.target.value.trim()) {
    filteredData.rows = arr;
  } else {
    filteredData.rows = arr.filter((item) => {
      return (
        Object.values(item).filter((val) =>
          val
            .toLowerCase()
            .trim()
            .includes(event.target.value.toLowerCase().trim())
        ).length > 0
      );
    });
  }
  populateTable();
  addPagination();
}

function onHandleChangeFileInput(event) {
  const arr = JSON.parse(JSON.stringify(files));
  if (!event.target.value.trim()) {
    filteredFilesData = arr;
  } else {
    filteredFilesData = arr.filter((item) => {
      return (
        Object.values(item).filter((val) =>
          val
            .toString()
            .toLowerCase()
            .trim()
            .includes(event.target.value.toLowerCase().trim())
        ).length > 0
      );
    });
  }
  populateFileListTable(filteredFilesData);
}

// Reset to the file list view
function resetToFileListView() {
  populateFileListTable(filteredFilesData);
  document.getElementById("table-container").classList.add("hidden");
  const listTableSection = document.getElementById("file-list-table-container");
  listTableSection.style.display = "block";
}

// Handle file input change event
function onFileInputChange() {
  const file = fileInput.files[0];
  if (file && file.name.endsWith(".csv")) {
    uploadBtn.disabled = false;
  }
  const selectedFileNameSection = document.getElementById("selected-file-name");
  const crossIcon = document.createElement("i");
  crossIcon.className = "fa-solid fa-xmark unselect-icon";
  crossIcon.id = "unselect-icon";
  crossIcon.addEventListener("click", () => {
    selectedFileNameSection.innerHTML = "";
    fileInput.value = "";
    uploadBtn.disabled = true;
  });
  if (selectedFileNameSection) {
    selectedFileNameSection.innerHTML = `${file.name}`;
    selectedFileNameSection.appendChild(crossIcon);
  }
}

// Upload the selected CSV file to the server
async function uploadFile() {
  showLoadingOverlay(true);
  const file = fileInput.files[0];
  if (!file) {
    showLoadingOverlay(false);
    showNotification("Please select a file.", "ERROR");
    return;
  }

  if (!file.name.endsWith(".csv")) {
    showLoadingOverlay(false);
    showNotification("Please upload a CSV file.", "ERROR");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(`${MAIN_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Failed to upload file.");
    }
    showNotification("File successfully uploaded!", "SUCCESS");
    files.push(data);
    filteredFilesData.push(data);
    populateFileListTable(filteredFilesData);
    fileInput.value = "";
    container.style.display = "none";
    document.getElementById("selected-file-name").innerHTML = "";
    uploadBtn.disabled = true;
    // uploadBtn.style.display = "none";
  } catch (error) {
    console.error("Error uploading file:", error);
    showNotification(error.message, "ERROR");
  }
  showLoadingOverlay(false);
}

// Fetch and display file data by file ID
async function viewFileData(fileId) {
  showLoadingOverlay(true);
  try {
    const response = await fetch(`${MAIN_URL}/file/${fileId}`);
    const data = await response.json();
    result = JSON.parse(JSON.stringify(data.data));
    filteredData = JSON.parse(JSON.stringify(data.data));
    document.getElementById("heading").style.display = "none";
    document.getElementById("file-list-table-container").style.display = "none";
    populateTable();
    addPagination();
  } catch (error) {
    console.error("Error viewing file data:", error);
    showNotification(error.message, "ERROR");
  }
  showLoadingOverlay(false);
}

// Change the current page and update the table
function changePage(fromPageNumber, toPageNumber) {
  if (
    toPageNumber >= 1 &&
    toPageNumber <= totalPages &&
    fromPageNumber !== toPageNumber
  ) {
    currentPage = toPageNumber;
    populateTable();
    const prevBtn = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    prevBtn.disabled = false;
    nextButton.disabled = false;
    if (currentPage === 1) {
      prevBtn.disabled = true;
    }
    if (currentPage === totalPages) {
      nextButton.disabled = true;
    }
    document
      .getElementById(`page-number-${fromPageNumber}`)
      .classList.remove("active-page");
    document
      .getElementById(`page-number-${toPageNumber}`)
      .classList.add("active-page");
  }
}

// Add pagination controls based on the filtered data
function addPagination() {
  currentPage = 1;
  totalPages = Math.ceil(filteredData.rows.length / limit);
  paginationContainer.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.className = "prev-next-btn";
  prevButton.id = "prev-btn";
  prevButton.innerText = "<";
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      changePage(currentPage, currentPage - 1);
    }
  });
  prevButton.disabled = true;
  paginationContainer.appendChild(prevButton);

  const pageNumberList = document.createElement("div");
  pageNumberList.id = "page-number-list";
  for (let i = 1; i <= totalPages; i++) {
    const pageNumber = document.createElement("div");
    pageNumber.className = "page-number";
    pageNumber.id = `page-number-${i}`;
    pageNumber.innerText = `${i}`;
    if (i === 1) {
      pageNumber.classList.add("active-page");
    }
    pageNumber.addEventListener("click", () => changePage(currentPage, i));
    pageNumberList.appendChild(pageNumber);
  }
  paginationContainer.appendChild(pageNumberList);

  const nextButton = document.createElement("button");
  nextButton.className = "prev-next-btn";
  nextButton.id = "next-btn";
  nextButton.innerText = ">";
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      changePage(currentPage, currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextButton);
}

// Populate the main table with data
function populateTable() {
  const columns = filteredData.columns;
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const rows = filteredData.rows.slice(startIndex, endIndex);

  const tableHeadersRow = document.getElementById("table-headers");
  const tableBody = document.getElementById("table-body");

  // Clear existing table data
  tableHeadersRow.innerHTML = "";
  tableBody.innerHTML = "";

  // Populate table headers
  columns.forEach((column) => {
    const th = document.createElement("th");
    const thDiv = document.createElement("div");
    thDiv.style.display = "flex";
    thDiv.style.justifyContent = "flex-start";
    thDiv.style.alignItems = "center";
    thDiv.style.flexWrap = "wrap";
    thDiv.style.gap = "5px";
    const heading = document.createElement("div");
    heading.className = "table-heading";
    heading.style.width = "90%";
    heading.style.display = "inline-block";
    heading.innerText = column;
    thDiv.appendChild(heading);
    const sortArrowIcon = document.createElement("i");
    sortArrowIcon.className = "fa-solid fa-arrow-up";
    sortArrowIcon.style.cursor = "pointer";
    if (sortBy !== null && sortBy === column) {
      sortArrowIcon.style.color = "green";
      if (sortOrder) {
        sortArrowIcon.style.transform = "";
      } else {
        sortArrowIcon.style.transform = "rotate(180deg)";
      }
    }
    sortArrowIcon.addEventListener("click", () => {
      sortBy = column;
      if (sortOrder === null || sortOrder) {
        sortOrder = false;
      } else {
        sortOrder = true;
      }
      filteredData.rows = JSON.parse(JSON.stringify(filteredData.rows)).sort(
        customSort
      );
      populateTable();
    });
    thDiv.appendChild(sortArrowIcon);
    th.appendChild(thDiv);
    tableHeadersRow.appendChild(th);
  });

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const img = document.createElement("img");
    img.src =
      "https://cdni.iconscout.com/illustration/premium/thumb/young-lady-with-no-data-10962328-8881952.png";
    img.style.width = "200px";
    img.style.height = "200px";
    td.appendChild(img);
    td.style.height = "200px";
    td.colSpan = fileListTableColumns.length;
    td.style.textAlign = "center";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  } else {
    // Populate table rows
    rows.forEach((rowData) => {
      const tr = document.createElement("tr");
      columns.forEach((column) => {
        const td = document.createElement("td");
        td.textContent = rowData[column];
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }
  // Show table container
  document.getElementById("table-container").classList.remove("hidden");
}

function openFile() {
  fileInput.click();
}

function showLoadingOverlay(show = true) {
  const overlay = document.getElementById("loading-overlay");
  if (show) {
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
}
