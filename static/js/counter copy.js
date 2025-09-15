class Counter_Manager
{
    static instance;
    constructor()
    {
        const current = this;
        this._page = new $(`
            <div class="back-ground">
                <div class="win">
                    <i class="bi bi-x-lg card-btn-close"></i>
                    <div class="store-list">
                        <div class="store-list-item"><i class="bi bi-trash"></i>&nbsp;
                        <div class="store-list-item-voca">
                            <label>清單</label>
                            <div class="store-list-item-voca">
                                <label>a</label>
                                <label>b</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        this._page.appendTo(document.body);
        this._page.hide();
        this._page.find('.card-btn-close').click(()=>{this.hide()});
        this._list = this._page.find('.store-list');
        this._store;
    }

    show()
    {
        this._page.show();
    }

    hide()
    {
        this._page.hide();
    }

    static show()
    {
        if(!Counter_Manager.instance)
        {
            Counter_Manager.instance = new Counter_Manager();
        }
        Counter_Manager.instance.show();
    }
    

}