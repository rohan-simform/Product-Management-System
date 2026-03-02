import { PMS } from './product.js';

//sync local storage data with PMS.Products object, 
//this will ensure data persistence across page reloads
PMS.syncLocalStorage();

const tbody = document.getElementById("t-body");
updateTableData(PMS.Products);

//event delegation for handling update and delete button clicks from dropdown
tbody.addEventListener('click', dropdownHandle);

const addForm = document.getElementById('addProductForm');
addForm.addEventListener("submit", addNewProduct);

const updateForm = document.getElementById('updateProductForm');
updateForm.addEventListener("submit", updateProduct);

const sortProduct = document.getElementById("sortProduct");
sortProduct.addEventListener("change", handleSort);

const searchInput = document.getElementById("searchBar");
searchInput.addEventListener("input", searchProduct);

//function to update table data, 
//if products parameter is not passed then it will use all products from PMS.Products
function updateTableData(products = PMS.Products) {
    //if no products available then show message in table
    if (!products || Object.keys(products).length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><center><strong>No Product Available</strong></center></td></tr>`;
        return;
    }

    //convert products object to array for easier iteration
    const productArray = Array.isArray(products) ? products : Object.values(products);
    tbody.innerHTML = "";

    productArray.forEach((product) => {

        let idCell = document.createElement("td");
        idCell.textContent = product.ProductId;

        let nameCell = document.createElement("td");
        nameCell.textContent = product.ProductName;

        let imgCell = document.createElement("td");
        imgCell.innerHTML = `<img src=${product.Image} alt=${product.ProductName} height="70px" width="70px" class="product-img rounded shadow-sm">`;

        let priceCell = document.createElement("td");
        priceCell.textContent = product.Price;

        let descCell = document.createElement("td");
        descCell.textContent = product.Description;

        let actionCell = document.createElement("td");
        actionCell.innerHTML =
            `<div class="dropdown">
            <button class="btn btn-sm btn-link text-dark" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots fs-5"></i>
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button type="button" class="dropdown-item update-btn" 
                    data-bs-toggle="modal" data-bs-target="#updateProductModal"
                    data-updateid="${product.ProductId}">
                        Update
                    </button>
                </li>
                <li>
                    <button type="button" class="dropdown-item text-danger delete-btn" data-deleteid="${product.ProductId}">
                        Delete
                    </button>
                </li>
            </ul>
        </div>`

        let tr = document.createElement("tr");
        tr.append(imgCell, idCell, nameCell, priceCell, descCell, actionCell);
        tbody.appendChild(tr);
    });
}

//convert image file to data URL using FileReader API
function getImageURL(productImage) {
    //return a promise that resolves with data URL of the image, 
    //this URL will be used to store image in local storage and display in table
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        //when file is read successfully resolve the promise with result (data URL), 
        //if error occurs reject the promise with error 
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);

        //read the file as data URL, this will trigger onload or onerror based on result
        reader.readAsDataURL(productImage);
    });
}

//validate product data before adding or updating, if img is false then image is not required for validation
function validateData(productId, productName, productImage, productPrice, productDescription, img = true) {

    if (!productId) return "Product ID is required";
    if (isNaN(productId)) return "Product ID must be numeric value";

    if (!productName) return "product Name is required";
    if (!/^[a-zA-Z0-9]+$/.test(productName)) return "Product Name must be alphanumeric";
    if (productName.length < 3) return "Product name too short";

    if (!productImage && img) return "product Image is required";
    if (productImage) {
        if (!productImage.type.startsWith("image/")) return "Only image files allowed";
        if (productImage.size > 2 * 1024 * 1024) return "Image must be under 2MB";
    }

    if (productPrice === "") return "Product Price is required";
    if (isNaN(productPrice) || Number(productPrice) <= 0) return "Price must be a positive number";

    if (!productDescription) return "product Description is required";
    if (productDescription.length < 5) return "Description too short";
    if (productDescription.length > 500) return "Description too big";

    return null;
}

//add new product to local storage and update table, validate data before adding
async function addNewProduct(e) {
    e.preventDefault();
    const productId = Number(document.getElementById('productId').value.trim()); //convert to number
    const productName = document.getElementById('productName').value.trim();
    const productPrice = document.getElementById('productPrice').value.trim();
    const productDescription = document.getElementById('productDescription').value.trim();
    const productImage = document.getElementById('productImage').files[0];

    const error = validateData(productId, productName, productImage, productPrice, productDescription);
    if (error) {
        alert(error);
        return;
    }

    const productImageURL = await getImageURL(productImage);

    const res = PMS.create(productId, productName, productImageURL, productPrice, productDescription)
    if (res) {
        alert("Product Created Successfully");
    } else {
        alert("Product Id Alredy Exist");
        return;
    }

    addForm.reset();

    const addProductModel = document.getElementById('addProductModal');
    const addModalInstance = bootstrap.Modal.getInstance(addProductModel);
    addModalInstance.hide();

    updateTableData();
}

//delete product based on product id
function deleteProduct(productId) {
    const res = PMS.delete(productId);
    if (res) {
        alert("Product Deleted Successfully");
    } else {
        alert("Product Does Not exist");
    }
    updateTableData();
}

//update product details based on product id, 
//if new image is not uploaded then keep old image
async function updateProduct(e) {
    e.preventDefault();

    const updateId = Number(document.getElementById('updateProductId').value.trim()); //convert to number
    const updatedName = document.getElementById('updateProductName').value.trim();
    const updatedPrice = document.getElementById('updateProductPrice').value.trim();
    const updatedDescription = document.getElementById('updateProductDescription').value.trim();
    const updatedImage = document.getElementById('updateProductImage').files[0];

    //validate data before updating, if image is not updated then pass old image to validate function to skip validation for image
    const error = validateData(updateId, updatedName, updatedImage, updatedPrice, updatedDescription, false);
    if (error) {
        alert(error);
        return;
    }

    let updatedImageURL = PMS.readProduct(updateId).Image;

    if (updatedImage) {
        updatedImageURL = await getImageURL(updatedImage);
    }

    const req = {
        ProductId: updateId,
        ProductName: updatedName,
        Image: updatedImageURL,
        Price: updatedPrice,
        Description: updatedDescription
    };

    const res = PMS.update(updateId, req);
    if (res) {
        alert("Product Updated Successfully");
    } else {
        alert("Product Id Does Not exist");
        return;
    }

    const updateProductModel = document.getElementById('updateProductModal');
    const updateModelInstance = bootstrap.Modal.getInstance(updateProductModel);
    updateModelInstance.hide();

    updateTableData();
}

//populate update modal with existing data based on product id
function openUpdateModel(productId) {
    const product = PMS.readProduct(productId);

    const updateProductId = document.getElementById('updateProductId');
    const updateProductName = document.getElementById('updateProductName');
    const updateProductPrice = document.getElementById('updateProductPrice');
    const updateProductDescription = document.getElementById('updateProductDescription');

    updateProductId.value = product.ProductId;
    updateProductName.value = product.ProductName;
    updateProductPrice.value = product.Price;
    updateProductDescription.value = product.Description;
}

//handle update and delete button click from dropdown
function dropdownHandle(e) {
    if (e.target.classList.contains("delete-btn")) {
        //get product id from data attribute of delete button and call delete function
        const productId = e.target.dataset.deleteid;
        deleteProduct(productId);
    }
    if (e.target.classList.contains("update-btn")) {
        //get product id from data attribute of update button and 
        //call function to open update modal with product details
        const productId = e.target.dataset.updateid;
        openUpdateModel(productId);
    }
}

//sort products based on id, name or price
function handleSort(e) {
    const sortType = e.target.value;
    const productsArray = Object.values(PMS.readAllProduct()); //converted to array for sorting

    if (sortType === "id") {
        productsArray.sort((a, b) => Number(a.ProductId) - Number(b.ProductId));
    }

    if (sortType === "name") {
        productsArray.sort((a, b) => a.ProductName.localeCompare(b.ProductName));
    }

    if (sortType === "price") {
        productsArray.sort((a, b) => Number(a.Price) - Number(b.Price));
    }

    updateTableData(productsArray);
}

//search product based on product id, it will do substring match
function searchProduct(e){
    
    const searchId = document.getElementById('searchBar').value.trim();

    const matchedProducts = Object.keys(PMS.Products)       //get all product keys
        .filter(key => key.includes(searchId))              //filter keys that include searchId (substring match)
        .map(key => PMS.Products[key]);                     //map matched keys to product objects

    updateTableData(matchedProducts);
}