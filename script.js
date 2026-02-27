import { PMS } from './product.js';

PMS.syncLocalStorage();
updateTableData(PMS.Products);

const addForm = document.getElementById('addProductForm');
addForm.addEventListener("submit", addNewProduct);

const updateForm = document.getElementById('updateProductForm');
updateForm.addEventListener("submit", updateProduct);

let tbody = document.getElementById("t-body");
tbody.addEventListener('click', dropdownHandle);

function updateTableData(products = PMS.Products) {
    let tbody = document.getElementById("t-body");
    if (Object.keys(products).length === 0 || !products) {
        tbody.innerHTML = `<tr><td colspan="6"><center><strong>No Product Available</strong></center></td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    Object.values(products).forEach((product) => {
        let idCell = document.createElement("td");
        idCell.textContent = product.ProductId;

        let nameCell = document.createElement("td");
        nameCell.textContent = product.ProductName;

        let imgCell = document.createElement("td");
        imgCell.innerHTML = `<img src=${product.Image} alt=${product.ProductName} 
        height="100px" width="100px" class="rounded mx-auto d-block img-thumbnail">`;

        let priceCell = document.createElement("td");
        priceCell.textContent = product.Price;

        let descCell = document.createElement("td");
        descCell.textContent = product.Description;

        let actionCell = document.createElement("td");
        actionCell.innerHTML =
            `<div class="dropdown">
            <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown">
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

function getImageURL(productImage) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);

        reader.readAsDataURL(productImage);
    });
}

function validateData(productId, productName, productImage, productPrice, productDescription, add = true) {
    if (!productId) return "Product ID is required";
    if (isNaN(productId)) return "Product ID must be numeric value";

    if (!productName) return "product Name is required";
    if (!/^[a-zA-Z0-9]+$/.test(productName)) return "Product Name must be alphanumeric";
    if (productName.length < 3) return "Product name too short";

    if (!productImage && add) return "product Image is required";
    if (productImage) {
        if (!productImage.type.startsWith("image/")) return "Only image files allowed";
        if (productImage.size > 2 * 1024 * 1024) return "Image must be under 2MB";
    }

    if (!productPrice) return "product Price is required";
    if (isNaN(productPrice) || Number(productPrice) <= 0) return "Price must be a positive number";

    if (!productDescription) return "product Description is required";
    if (productDescription.length < 5) return "Description too short";
    if (productDescription.length > 500) return "Description too big";

    return null;
}

async function addNewProduct(e) {
    e.preventDefault();
    const productId = document.getElementById('productId').value.trim();
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

function deleteProduct(productId) {
    const res = PMS.delete(productId);
    if (res) {
        alert("Product Deleted Successfully");
    } else {
        alert("Product Does Not exist");
    }
    updateTableData();
}

async function updateProduct(e) {
    e.preventDefault();

    const updateId = document.getElementById('updateProductId').value.trim();
    const updatedName = document.getElementById('updateProductName').value.trim();
    const updatedPrice = document.getElementById('updateProductPrice').value.trim();
    const updatedDescription = document.getElementById('updateProductDescription').value.trim();
    const updatedImage = document.getElementById('updateProductImage').files[0];

    const error = validateData(updateId, updatedName, updatedImage, updatedPrice, updatedDescription, false);
    if (error) {
        alert(error);
        return;
    }

    let updatedImageURL = PMS.Products[updateId].Image;

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

function dropdownHandle(e) {
    if (e.target.classList.contains("delete-btn")) {
        const productId = e.target.dataset.deleteid;
        deleteProduct(productId);
    }
    if (e.target.classList.contains("update-btn")) {
        const productId = e.target.dataset.updateid;
        openUpdateModel(productId);
    }
}