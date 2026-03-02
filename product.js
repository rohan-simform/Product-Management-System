export const PMS = {
    //Object that stores: productId:{productId, productName, productImage, productPrice, productDescription}
    products: {},

    //Sync Product object with localstorage
    //If StoredProduct is null or undefined return so object does not change
    //If current object does not match with Localstorage
    //then update the Product object
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
    create(productId, productName, productImage, productPrice, productDescription) {
        if (this.products[productId]) {
            console.log("Product Already exist");
            return false;
        }
        this.products[productId] = { productId, productName, productImage, productPrice, productDescription };
        this.updateLocalStorage()
        console.log("Product Created");
        return true;
    },

    //Returns particular Product based on productId
    readProduct(productId) {
        if (!this.products[productId]) {
            console.log("Product Already exist");
            return;
        }
        this.syncLocalStorage();
        return this.products[productId];
    },

    //Returns object that contains all Product
    readAllProduct() {
        this.syncLocalStorage();
        return this.products;
    },

    //Removes Product object from Products object
    delete(productId) {
        if (!this.products[productId]) {
            console.log("Product Does Not exist");
            return false;
        }
        delete this.products[productId];
        this.updateLocalStorage()
        console.log("Product Deleted");
        return true;
    },

    //Updates whole product value in Products Object
    update(productId, NewData) {
        if (!this.products[productId]) {
            console.log("Product Does Not exist");
            return false;
        }
        this.products[productId] = NewData;
        this.updateLocalStorage();
        return true;
    }
}