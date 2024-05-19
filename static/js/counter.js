
function formatTime(seconds) 
{
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;

    // 將小於10的數字轉換為兩位數
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    //return hours + ':' + minutes + ':' + seconds;
    return minutes + ':' + seconds;
}

class Ctrl
{
    constructor()
    {
        const current = this;
        this._page = new $(`
            <div class="page-ctrl">
                <div class="type">
                    <select>
                        <option value="跳躍">跳躍</option>
                        <option value="休息">休息</option>  
                    </select>
                    <div><label name="speed" class="btn">60</label><sub>/分</sub></div>
                    <sub name="delta">60</sub>
                </div>
                <hr>
                
                <div class="time">
                    <i class="bi bi-dash-circle btn" style="font-size:2rem"></i>    
                    <label name="time" style="font-size:3rem">00:00</label>
                    <i class="bi bi-plus-circle btn" style="font-size:2rem"></i>
                </div>
                <hr>
                <div class="ctrl">
                    <i class="bi bi-pause-circle btn"></i>
                    <i class="bi bi-play-circle btn"></i>
                    <i class="bi bi-stop-circle btn"></i>
                </div>
            </div>
        `);
        this._page.appendTo(document.body);
        this._page.hide();
        
        this._type = this._page.find('select').on('change',(e)=>{this.change(e);});
        this._lb_delta = this._page.find('sub[name="delta"]').click(()=>{this.delta();});
        this._lb_time = this._page.find('label[name="time"]');
        this._lb_speed = this._page.find('label[name="speed"]').click(()=>{this.speed();});

        this._page.find('.bi-dash-circle').click(()=>{this.minus();});
        this._page.find('.bi-plus-circle').click(()=>{this.plus();});

        this._btn_pause = this._page.find('.bi-pause-circle').click(()=>{this.pause()});
        this._btn_pause.hide();
        this._btn_play = this._page.find('.bi-play-circle').click(()=>{this.play()});
        this._page.find('.bi-stop-circle').click(()=>{this.stop()});
        this._sec;
        this._timer;
        this._counter;
        this._data;
        this._d=60;
        this._speed=60;
        this._interval=1000;
        this._td=1;
        this._beep = new Audio('static/stop-13692.mp3');
        this._click = new Audio('static/start-13691.mp3');
        this._skip = false;
    }

    // edit
    change(e)
    {
        this._data.type = e.target.value;
        this.update(this._data);
    }

    speed()
    {
        switch(this._speed)
        {
            case 60: this._speed = 70; break;
            case 70: this._speed = 80; break;
            case 80: this._speed = 60; break;
        }
        this._lb_speed.text(this._speed);
        this._data.speed = this._speed;
        this.update(this._data);
    }

    delta()
    {
        switch(this._d)
        {
            case 1: this._d = 30; break;
            case 30: this._d = 60; break;
            case 60: this._d = 1; break;
        }
        this._lb_delta.text(this.fmt(this._d));
    }

    fmt(delta)
    {
        return delta < 10 ? '0' + delta : delta;
    }

    plus()
    {
        let d = this._d;
        this._data.sec += d; 
        this._sec = this._data.sec;
        this._lb_time.text(formatTime(this._data.sec)); 
        this.update(this._data);
    }

    minus()
    {
        let d = this._d;
        this._data.sec = Math.max(this._data.sec-d,0); 
        this._sec = this._data.sec;
        this._lb_time.text(formatTime(this._data.sec)); 
        this.update(this._data);
    }

    async update()
    {
        await schePut(this._data);
        Schedule.update(this._data);
    }

    // ctrl
    speak()
    {
        let type = this._data.type;
        let [min,sec] = formatTime(this._sec).split(':').map((x)=>parseInt(x));
        let time = "";
        if(min){time += min+(sec?'分':'分鐘');} 
        if(sec){time += sec+'秒'}; 
        Utility.speak(type+time);
    }

    startTimer()
    {
        this._timer = setInterval(async()=>{
            this._sec--;
            this._lb_time.text(formatTime(this._sec));
            if(this._sec<=0)
            {
                clearInterval(this._timer);
                clearInterval(this._counter);
                if(this._data.type == '休息')
                {
                    Utility.speak('休息時間到');
                    await delay(2);
                }
                Schedule.next();
            }
        },1000);
    }

    startCounter()
    {
        let cnt = this._speed*5;
        this._interval = 1000*60/this._speed;

        this._counter = setInterval(async()=>{
            if(this._data.type == '跳躍') 
            {
                this._beep.play();
                if(this._sec > 5 && cnt <= 0)
                {
                    cnt = this._speed * 5;
                    Utility.speak('阿屎跳高一點');
                    Utility.speak('阿皮跳快一點');
                }
                else if(cnt > 0) {cnt--;}   
            }
        },this._interval);
    }

    async play()
    {
        if(this._skip) {return}
        this._skip = true;

        this.speak();
        this._btn_pause.show();
        this._btn_play.hide();
        await delay(1);

        if(this._sec <= 0)
        {
            Schedule.next();
            return;
        }
        
        this.startCounter();
        this.startTimer();
        
        this._skip = false;
    }


    pause()
    {
        if(this._skip) {return}

        this._btn_pause.hide();
        this._btn_play.show();
        clearInterval(this._timer);
        clearInterval(this._counter);
        Utility.speak('暫停');
    }

    stop()
    {
        if(this._skip) {return}

        clearInterval(this._timer);
        clearInterval(this._counter);
        this.hide();
        Schedule.stop();
        Utility.speak('停止');
    }

    async show(data, play=false)
    {
        this._skip = false;
        this._page.show();

        this._btn_pause.hide();
        this._btn_play.show();

        this._data = data;
        this._sec = data.sec;
        this._type.val(data.type);
        this._lb_time.text(formatTime(data.sec));
        this._lb_speed.text(data.speed);
        if(play){this.play();}
    }

    hide()
    {
        this._page.hide();
    }

    static hide()
    {
        if(!Ctrl.instance){return;}
        Ctrl.instance.hide();
    }

    static show(data, play=false)
    {
        if(!Ctrl.instance){Ctrl.instance = new Ctrl();}
        Ctrl.instance.show(data, play);
    }
}


class Schedule
{
    static instance;
    constructor()
    {
        const current = this;
        this._page = new $(`
            <div class="page-schedule">
                <div style="text-align:center">排程</div>
                <hr>
                <div class="list">
                </div>
            </div>
        `);
        this._page.appendTo(document.body);
        this._page.hide();
        this._page.find('.card-btn-close').click(()=>{this.hide()});
        this._list = this._page.find('.list');
        this._sche;
        this._idx;
        this._selected;
    }

    btn_add()
    {
        let group = new $(`<div style="text-align:center"><i class="bi bi-plus-lg btn"></i></div>`);
        group.find('.btn').click(async()=>{
            let data = {type:'跳躍', speed:60, sec:0};
            await schePut(data);
            this.show_items();
            Ctrl.hide();
        });

        this._list.append(group);
    }


    add_item(data)
    {
        let item = $(`
            <div class="item">
                <label style="user-select: none; pointer-events: none;">${data.type}</label>
                <label style="user-select: none; pointer-events: none;">${formatTime(data.sec)}</label>
                <i class="bi bi-x-lg btn"></i>
            </div>
        `);
        this._list.append(item);
        item.click((e)=>{this.select_item($(e.target),data)});
        item.find('.btn').click((e)=>{this.delete(e,data)});
    }

    select_item(target, data)
    {
        //console.log(data);
        if(this._selected){this._selected.css('background-color','');}
        this._selected = target;
        console.log(target);
        target.css('background-color','lightgreen');
        this._idx = this._sche.indexOf(data);
        Ctrl.show(data);
       
    }

    async delete(e, data)
    {
        e.stopPropagation();
        await scheDelete(data);
        this.show_items();
        Ctrl.hide();
    }

    update(data)
    {
        this._selected.find('label').eq(0).text(data.type);
        this._selected.find('label').eq(1).text(formatTime(data.sec));
    }

    stop()
    {
        if(this._selected){this._selected.css('background-color','');}
        this._selected = null;
    }

    async show_items()
    {
        this._sche = await scheGetAll();
        this._list.empty();
        this._sche.map((data)=>{ 
            this.add_item(data);
        });
        this.btn_add();

    }

    next()
    {
         this._idx++;
         if(this._idx < this._sche.length)
         {
            this._selected.css('background-color','');
            this._selected = this._list.children().eq(this._idx);
            this._selected.css('background-color','lightgreen');
            Ctrl.show(this._sche[this._idx], true);
            // Scroll the item into the center of the view
            this._selected[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
         else
         {
            this._selected.css('background-color','');
            this._selected = null;
            Ctrl.hide();
            console.log('end');
            Utility.speak('結束');
         }
    }

    async show()
    {
        this._page.show();
        this._sche = await scheGetAll();
        console.log(this._sche);
        this.show_items();
    }

    hide()
    {
        this._page.hide();
    }

    static stop()
    {
        if(!Schedule.instance){return;}
        Schedule.instance.stop();
        
    }

    static update(data)
    {
        if(!Schedule.instance){return;}
        Schedule.instance.update(data);
    }

    static next()
    {
        if(!Schedule.instance){return;}
        Schedule.instance.next();
    }

    static show()
    {
        if(!Schedule.instance){Schedule.instance = new Schedule();}
        Schedule.instance.show();
    }
    

}