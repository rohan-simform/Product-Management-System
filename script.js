import { PMS } from './product.js';

//sync local storage data with PMS.Products object, 
//this will ensure data persistence across page reloads
PMS.syncLocalStorage();

const tbody = document.getElementById("t-body");
updateTableData();

//event delegation for handling update and delete button clicks
tbody.addEventListener('click', handleAction);

const Form = document.getElementById('productForm');
Form.addEventListener("submit", handleProductSubmit);

const addBtn = document.getElementById("addBtn")
addBtn.addEventListener("click", () => {
    document.getElementById("formMode").value = "add";
    document.getElementById("modalTitle").textContent = "Add New Product";
    document.getElementById("productId").disabled = false;
    document.getElementById('productImage').required = true;
    document.getElementById("productForm").reset();
});

const sortProduct = document.getElementById("sortProduct");
sortProduct.addEventListener("change", handleSort);

const searchInput = document.getElementById("searchBar");
searchInput.addEventListener("input", searchProduct);

//function to update table data, 
//if products parameter is not passed then it will use all products from PMS.Products
function updateTableData(products = PMS.products) {
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
        idCell.textContent = product.productId;

        let nameCell = document.createElement("td");
        nameCell.textContent = product.productName;

        let imgCell = document.createElement("td");
        imgCell.innerHTML = `<img src=${product.productImage} alt=${product.productName} height="70px" width="70px" class="product-img rounded shadow-sm">`;

        let priceCell = document.createElement("td");
        priceCell.textContent = product.productPrice;

        let descCell = document.createElement("td");
        descCell.textContent = product.productDescription;

        let actionCell = document.createElement("td");
        actionCell.innerHTML =
            `<div class="d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary update-btn" data-bs-toggle="modal" data-bs-target="#productModal" data-updateid="${product.productId}"> 
                    <i class="bi bi-pencil"></i>   Update 
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-deleteid="${product.productId}">
                    <i class="bi bi-trash"></i> Delete 
                </button>
            </div>`

        let tr = document.createElement("tr");
        tr.append(idCell, imgCell, nameCell, priceCell, descCell, actionCell);
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

async function handleProductSubmit(e) {
    e.preventDefault();

    const mode = document.getElementById("formMode").value;

    const productId = Number(document.getElementById('productId').value.trim());
    const productName = document.getElementById('productName').value.trim();
    const productPrice = document.getElementById('productPrice').value.trim();
    const productDescription = document.getElementById('productDescription').value.trim();
    const productImage = document.getElementById('productImage').files[0];

    const error = validateData(
        productId,
        productName,
        productImage,
        productPrice,
        productDescription,
        mode === "add" // image required only in add mode
    );

    if (error) {
        alert(error);
        return;
    }

    let imageURL;

    if (mode === "add") {
        imageURL = await getImageURL(productImage);
        PMS.addProduct(productId, productName, imageURL, productPrice, productDescription);
        alert("Product Created Successfully");
    } else {
        const oldProduct = PMS.getProduct(productId);
        imageURL = oldProduct.productImage;

        if (productImage) {
            imageURL = await getImageURL(productImage);
        }

        PMS.updateProduct(productId, {
            productId: productId,
            productName: productName,
            productImage: imageURL,
            productPrice: productPrice,
            productDescription: productDescription
        });

        alert("Product Updated Successfully");
    }

    document.getElementById('productForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    updateTableData();
}

//delete product based on product id
function deleteProduct(productId) {
    const res = PMS.deleteProduct(productId);
    if (res) {
        alert("Product Deleted Successfully");
    } else {
        alert("Product Does Not exist");
    }
    updateTableData();
}

//change title of model
//populate update modal with existing data based on product id
function openUpdateModel(productId) {
    const product = PMS.getProduct(productId);

    document.getElementById("formMode").value = "update";
    document.getElementById("modalTitle").textContent = "Update Product";

    document.getElementById('productId').value = product.productId;
    document.getElementById('productId').disabled = true;

    document.getElementById('productImage').required = false;

    document.getElementById('productName').value = product.productName;
    document.getElementById('productPrice').value = product.productPrice;
    document.getElementById('productDescription').value = product.productDescription;
}

//handle update and delete button click from dropdown
function handleAction(e) {
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
    const productsArray = Object.values(PMS.getAllProducts()); //converted to array for sorting

    if (sortType === "id") {
        productsArray.sort((a, b) => Number(a.productId) - Number(b.productId));
    }

    if (sortType === "name") {
        productsArray.sort((a, b) => a.productName.localeCompare(b.productName));
    }

    if (sortType === "price") {
        productsArray.sort((a, b) => Number(a.productPrice) - Number(b.productPrice));
    }

    updateTableData(productsArray);
}

//search product based on product id, it will do substring match
function searchProduct(e){
    
    const searchId = document.getElementById('searchBar').value.trim();

    const matchedProducts = Object.keys(PMS.products)       //get all product keys
        .filter(key => key.includes(searchId))              //filter keys that include searchId (substring match)
        .map(key => PMS.products[key]);                     //map matched keys to product objects

    updateTableData(matchedProducts);
}