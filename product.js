export const PMS = {
    //Object that stores: productId:{productId, productName, productImage, productPrice, productDescription}
    products: {},

    //Sync Product object with localstorage 
    //If current object does not match with Localstorage data,  
    //then update the Product object with localstorage data
    syncLocalStorage() {
        const StoredProduct = localStorage.getItem("product");

        if (!StoredProduct) return;

        if (JSON.stringify(this.products) !== StoredProduct) {
            this.products = JSON.parse(StoredProduct);
        }
    },

    //Updates LocalStorage with Product Object
    updateLocalStorage() {
        localStorage.setItem("product", JSON.stringify(this.products));
    },

    //Add new Product in Product Object
    addProduct(productId, productName, productImage, productPrice, productDescription) {
        if (this.products[productId]) {
            return false;
        }
        this.products[productId] = { productId, productName, productImage, productPrice, productDescription };
        this.updateLocalStorage()
        return true;
    },

    //Returns particular Product based on ProductId
    getProduct(productId) {
        if (!this.products[productId]) {
            return;
        }
        this.syncLocalStorage();
        return this.products[productId];
    },

    //Returns object that contains all Product
    getAllProducts() {
        this.syncLocalStorage();
        return this.products;
    },

    //Removes Product object from Products object
    deleteProduct(productId) {
        if (!this.products[productId]) {
            return false;
        }
        delete this.products[productId];
        this.updateLocalStorage()
        return true;
    },

    //Updates whole product value in Products Object
    updateProduct(productId, newData) {
        if (!this.products[productId]) {
            return false;
        }
        this.products[productId] = newData;
        this.updateLocalStorage();
        return true;
    }
}