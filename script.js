import { PMS } from './product.js';

PMS.syncLocalStorage();
updateTableData(PMS.products);

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

let tbody = document.getElementById("t-body");
tbody.addEventListener('click', handleAction);

function updateTableData(products = PMS.products) {
    let tbody = document.getElementById("t-body");
    if (Object.keys(products).length === 0 || !products) {
        tbody.innerHTML = `<tr><td colspan="6"><center><strong>No Product Available</strong></center></td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    Object.values(products).forEach((product) => {
        let idCell = document.createElement("td");
        idCell.textContent = product.productId;

        let nameCell = document.createElement("td");
        nameCell.textContent = product.productName;

        let imgCell = document.createElement("td");
        imgCell.innerHTML = `<img src=${product.productImage} alt=${product.productName} 
        height="100px" width="100px" class="rounded mx-auto d-block img-thumbnail">`;

        let priceCell = document.createElement("td");
        priceCell.textContent = product.productPrice;

        let descCell = document.createElement("td");
        descCell.textContent = product.productDescription;

        let actionCell = document.createElement("td");
        actionCell.innerHTML =
            `<div class="dropdown">
            <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots fs-5"></i>
            </button>
            <ul class="dropdown-menu">
                <li>
                    <button type="button" class="dropdown-item update-btn" 
                    data-bs-toggle="modal" data-bs-target="#productModal"
                    data-updateid="${product.productId}">
                        Update
                    </button>
                </li>
                <li>
                    <button type="button" class="dropdown-item text-danger delete-btn" data-deleteid="${product.productId}">
                        Delete
                    </button>
                </li>
            </ul>
        </div>`

        let tr = document.createElement("tr");
        tr.append(idCell, imgCell, nameCell, priceCell, descCell, actionCell);
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
        PMS.create(productId, productName, imageURL, productPrice, productDescription);
        alert("Product Created Successfully");
    } else {

        const oldProduct = PMS.readProduct(productId);
        imageURL = oldProduct.Image;

        if (productImage) {
            imageURL = await getImageURL(productImage);
        }

        PMS.update(productId, {
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

function deleteProduct(productId) {
    const res = PMS.delete(productId);
    if (res) {
        alert("Product Deleted Successfully");
    } else {
        alert("Product Does Not exist");
    }
    updateTableData();
}

function openUpdateModel(productId) {
    const product = PMS.readProduct(productId);

    document.getElementById("formMode").value = "update";
    document.getElementById("modalTitle").textContent = "Update Product";

    document.getElementById('productId').value = product.productId;
    document.getElementById('productId').disabled = true;

    document.getElementById('productImage').required = false;

    document.getElementById('productName').value = product.productName;
    document.getElementById('productPrice').value = product.productPrice;
    document.getElementById('productDescription').value = product.productDescription;
}

function handleAction(e) {
    if (e.target.classList.contains("delete-btn")) {
        const productId = e.target.dataset.deleteid;
        deleteProduct(productId);
    }
    if (e.target.classList.contains("update-btn")) {
        const productId = e.target.dataset.updateid;
        openUpdateModel(productId);
    }
}