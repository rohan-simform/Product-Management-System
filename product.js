export const PMS = {
    //Object that stores: ProductId:{ProductId, ProductName, Image, Price, Description}
    Products: {},

    //Sync Product object with localstorage
    //If current object does not match with Localstorage and StoredProduct is not null
    //then update the Product object
    syncLocalStorage() {
        const StoredProduct = localStorage.getItem("Product");
        if (JSON.stringify(this.Products) !== StoredProduct && StoredProduct) {
            this.Products = JSON.parse(StoredProduct);
        }
    },

    //Updates LocalStorage with Product Object
    updateLocalStorage() {
        localStorage.setItem("Product", JSON.stringify(this.Products));
    },

    //Add new Product in Product Object
    createProduct(ProductId, ProductName, Image, Price, Description) {
        if (this.Products[ProductId]) {
            console.log("Product Already exist");
            return;
        }
        this.Products[ProductId] = { ProductId, ProductName, Image, Price, Description };
        this.updateLocalStorage()
        console.log("Product Created");
    },

    //Returns particular Product based on ProductId
    readProduct(ProductId) {
        if (!this.Products[ProductId]) {
            console.log("Product Already exist");
            return;
        }
        return this.Products[ProductId];
    },

    //Returns object that contains all Product
    readAllProduct() {
        return this.Products;
    },

    //Removes Product object from Products object
    deleteProduct(ProductId) {
        if (!this.Products[ProductId]) {
            console.log("Product Does Not exist");
            return;
        }
        delete this.Products[ProductId];
        this.updateLocalStorage()
        console.log("Product Deleted");
    },

    //Updates whole product value in Products Object
    update(ProductId, NewData) {
        if (!this.Products[ProductId]) {
            console.log("Product Does Not exist");
            return;
        }
        this.Products[ProductId] = NewData;
        this.updateLocalStorage()
    }
}