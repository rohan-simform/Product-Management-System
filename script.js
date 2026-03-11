import { PMS } from './product.js';

PMS.syncLocalStorage();

const $tbody = $("#t-body");
updateTableData();

// Event delegation for update/delete actions
$tbody.on('click', '.update-btn, .delete-btn', handleAction);

$('#productForm').on("submit", handleProductSubmit);

$("#addBtn").on("click", () => {
    $("#formMode").val("add");
    $("#modalTitle").text("Add New Product");
    $("#productId").prop("disabled", false);
    $('#productImage').prop("required", true);
    $("#productForm")[0].reset();
});

$("#sortProduct").on("change", handleSort);

$("#searchBar, #searchBtn").on("input click", searchProduct);

function updateTableData(products = PMS.products) {
    if (!products || Object.keys(products).length === 0) {
        $tbody.html(`<tr><td colspan="6"><center><strong>No Product Available</strong></center></td></tr>`);
        return;
    }

    const productArray = Array.isArray(products) ? products : Object.values(products);
    
    $tbody.html("");
    
    productArray.forEach((product) => {
        const row = `
            <tr>
                <td>${product.productId}</td>
                <td><img src="${product.productImage}" alt="${product.productName}" height="70" width="70" class="product-img rounded shadow-sm"></td>
                <td>${product.productName}</td>
                <td>${product.productPrice}</td>
                <td>${product.productDescription}</td>
                <td>
                    <div class="d-flex justify-content-center gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary update-btn" data-bs-toggle="modal" data-bs-target="#productModal" data-updateid="${product.productId}"> 
                            <i class="bi bi-pencil"></i> Update 
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-deleteid="${product.productId}">
                            <i class="bi bi-trash"></i> Delete 
                        </button>
                    </div>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });
}

// Returns a promise that resolves with the image data URL
function getImageURL(productImage) {
    //return a promise that resolves with data URL of the image, 
    //this URL will be used to store image in local storage and display in table
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        //when file is read successfully resolve the promise with result (data URL), 
        //if error occurs reject the promise with error 
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);

        //Read the file -  converts the file to a base64 data URL 
        //This will trigger onload or onerror based on result
        reader.readAsDataURL(productImage);
    });
}

//img=false skips image validation (used in update mode)
function validateData(productId, productName, productImage, productPrice, productDescription, img = true) {
    if (!productId) return "Product ID is required";
    if (isNaN(productId)) return "Product ID must be numeric value";

    if (!productName) return "Product Name is required";
    if (!/^[a-zA-Z0-9 -_]+$/.test(productName)) return "Product Name must be alphanumeric";
    if (productName.length < 3) return "Product Name is too short";

    if (!productImage && img) return "Product Image is required";
    if (productImage) {
        if (!productImage.type.startsWith("image/")) return "Only image files are allowed";
        if (productImage.size > 2 * 1024 * 1024) return "Image must be under 2 MB";
    }

    if (productPrice === "") return "Product Price is required";
    if (isNaN(productPrice) || Number(productPrice) <= 0) return "Price must be a positive number";

    if (!productDescription) return "Product Description is required";
    if (productDescription.length < 5) return "Description is too short";
    if (productDescription.length > 500) return "Description is too long";

    return null;
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const mode = $("#formMode").val();

    const productId = Number($('#productId').val().trim());
    const productName = $('#productName').val().trim();
    const productPrice = $('#productPrice').val().trim();
    const productDescription = $('#productDescription').val().trim();
    const productImage = $('#productImage')[0].files[0];

    const error = validateData(
        productId,
        productName,
        productImage,
        productPrice,
        productDescription,
        mode === "add" //image required only in add mode
    );

    if (error) {
        alert(error);
        return;
    }

    let imageURL;

    if (mode === "add") {
        try {
            imageURL = await getImageURL(productImage);
        } catch {
            alert("Failed to read image file. Please try again.");
            return;
        }
        PMS.addProduct(productId, productName, imageURL, productPrice, productDescription);
        alert("Product Created Successfully");
    } else {
        imageURL = PMS.getProduct(productId).productImage;

        if (productImage) {
            try {
                imageURL = await getImageURL(productImage);
            } catch {
                alert("Failed to read image file. Please try again.");
                return;
            }
        }

        PMS.updateProduct(productId, { productId, productName, productImage: imageURL, productPrice, productDescription });
        alert("Product Updated Successfully");
    }
    $('#productForm')[0].reset();
    bootstrap.Modal.getInstance($('#productModal')).hide();
    updateTableData();
}

function deleteProduct(productId) {
    const res = PMS.deleteProduct(productId);
    if (res) {
        alert("Product Deleted Successfully");
    } else {
        alert("Product Does Not exist");
    }
    updateTableData();
}

function openUpdateModel(productId) {
    const product = PMS.getProduct(productId);

    $("#formMode").val("update");
    $("#modalTitle").text("Update Product");
    $('#productId').val(product.productId).prop("disabled", true);
    $('#productImage').prop("required", false);
    $('#productName').val(product.productName);
    $('#productPrice').val(product.productPrice);
    $('#productDescription').val(product.productDescription);
}

//handle update and delete button click from dropdown
function handleAction(e) {
    const actionBtn = $(e.target).closest(".delete-btn, .update-btn");

    if (actionBtn.hasClass("delete-btn")) {
        deleteProduct(actionBtn.data("deleteid"));
    } else if (actionBtn.hasClass("update-btn")) {
        openUpdateModel(actionBtn.data("updateid"));
    }
}

//sort products based on id, name or price
function handleSort(e) {
    const sortType = $(e.target).val();
    const productsArray = Object.values(PMS.getAllProducts());

    if (sortType === "id") productsArray.sort((a, b) => Number(a.productId) - Number(b.productId));
    if (sortType === "name") productsArray.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sortType === "price") productsArray.sort((a, b) => Number(a.productPrice) - Number(b.productPrice));

    updateTableData(productsArray);
}

//search product based on product id, it will do substring match
function searchProduct(){
    const searchId = $('#searchBar').val().trim();

    const matchedProducts = Object.keys(PMS.products)       //get all product keys
        .filter(key => key.includes(searchId))              //filter keys that include searchId (substring match)
        .map(key => PMS.products[key]);                     //map matched keys to product objects

    updateTableData(matchedProducts);
}