class Utility
{
    static getCookie(key) 
    {
        // decodeURI : 解決 iphone 無法存中文 cookie 的問題
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${key}=`);
        if (parts.length === 2) { return decodeURI(parts.pop().split(';').shift()); }
    }

    static addCookie(key, value, max_age=999999999) 
    {
        // encodeURI : 解決 iphone 無法存中文 cookie 的問題
        value = encodeURI(value);
        let maxAge = max_age > 0 ? ';max-age='+max_age : '';
        document.cookie = `${key}=${value}${maxAge};path=/;SameSite=lax;`;
    }

    static delCookie( key, path, domain ) 
    {
        document.cookie = key + "=" +
            ((path) ? ";path="+path : "")+
            ((domain) ? ";domain="+domain : "") +
            ";max-age=-1;";
    }

    static showCookies() 
    {
        alert(document.cookie);
    }

    static isServiceWorkerReady()
    {
        if ('serviceWorker' in navigator) 
        {
            return navigator.serviceWorker.getRegistration().then(function(registration) {
                if (registration) 
                {
                    console.log('Service Worker is running:', registration);
                    return true;
                } 
                else 
                {
                    console.log('Service Worker is not running.');
                    return false;
                }
            })
            .catch(function(error) {
                console.error('Error when checking Service Worker:', error);
            });
        } 
        else 
        {
            console.log('Service Worker is not supported.');
            return false;
        }
    }

    static unregisterServiceWorker()
    {
        if ('serviceWorker' in navigator) 
        {
            return navigator.serviceWorker.getRegistration().then(function(registration) {
                if (registration) 
                {
                    registration.unregister().then(success => {
                        if (success) {
                            console.log('Service Worker unregistered successfully');
                        } else {
                            console.log('Failed to unregister Service Worker');
                        }
                    });
                } 
                else 
                {
                    console.log('No Service Worker found with this scope');
                }
            })
            .catch(function(error) {
                console.error('Error when checking Service Worker:', error);
            });
        } 
        else 
        {
            console.log('Service Worker is not supported.');
        }
    }

    static registerServiceWorker(onmessage)
    {
        if ('serviceWorker' in navigator) 
        {
            navigator.serviceWorker.register('/service-worker.js').then( registration => {
                console.log('Service Worker 註冊成功');
                navigator.serviceWorker.onmessage = onmessage;
            })
            .catch( error => {
                console.error('Service Worker 註冊失敗:', error);
            });

            /*
            navigator.serviceWorker.ready.then(reg=> {
                // 向Service Worker发送消息
                reg.active.postMessage('Hello, Service Worker!');
   
            });
            */
        }
        else 
        {
          console.log("Service workers are not supported.");
        }
    }

    static async postMessage(msg)
    {
        if(navigator.serviceWorker)
        {
            let registration = await navigator.serviceWorker.ready;
            registration.active.postMessage(msg);
        }
    }

    static enUS(text) 
    {
        // 正規表達式比對英文字母
        const englishPattern = /[^a-zA-Z'-\s]/;
      
        // 檢查文字中是否包含英文字母以外的字元
        return !englishPattern.test(text);
    }

    static speak(content, lang)
    {
        if(content)
        {
            let utterance = new SpeechSynthesisUtterance(content);
            if(lang) {utterance.lang = lang;} 
            else if(this.enUS(content)) { utterance.lang = 'en-US'; } //'en-US' => 英文（美國）
            else { utterance.lang = 'zh-TW'; } //'zh-TW' => 中文（台灣）
            //utterance.rate = !Setting.data.speed ? 1 : Setting.data.speed;
            //console.log(utterance.rate);
            window.speechSynthesis.speak(utterance);
        }
    }

    static resolution()
    {
        console.log(`device size : (${screen.width} , ${screen.height})`);
        console.log(`browser size : (${window.innerWidth} , ${window.innerHeight})`);
    }

    static isMobile()
    {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }

    static get_vn_voca()
    {
        return $.ajax({
            url: `query_voca/?type=time`,
            type: 'GET',
        })
        .catch(error => {
            console.log('Network no response!!!');
            return 'error';
        });
        
        /*
        return fetch('version/?option=get')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            return { 'number': -1 };
        });
        */
        
    }

    static async check_version_voca()
    {
        let cloud = await this.get_vn_voca();
        let local = !Setting.data.vn_voca ? 0 : Setting.data.vn_voca;
        let upgrade = Utility.isTimestamp(cloud) ? cloud != local : false;
        return {'cloud':cloud, 'local':local, 'upgrade': upgrade }
    }

    static getChoice(elm)
    {
        let cho = {};
        cho.cat = [];
        elm.find('.drop-cat input:checked').each((i,e)=>{
            //console.log(i,',',e);
            cho.cat.push(e.value);   
        })

        cho.opt = {};
        elm.find('.drop-opt input[type=checkbox]').each((i,e)=>{
            if(e.value == 'pro')
            {
                cho.opt[e.value] = e.checked;   // ? $(e).siblings('select').val() : 101;
                cho.sel = $(e).siblings('select').val();
            }
            else
            {
                cho.opt[e.value] = e.checked;
            }
        })

        cho.mode = elm.find('input[type=radio]:checked').val();

        return cho;
    }

    static filter_sentence(data, cho)
    {
        //let cho = this.getChoice();
        let out = [];

        if(!Array.isArray(data)){data = Object.values(data);}

        data.forEach(element=>{
            if(cho.cat.indexOf(element.fields.category) != -1)
            {
                out.push(element);     
            }
        });

        if(cho.opt.rnd){out.sort(() => Math.random() - 0.5);}
        return out;

    }

    static filter_voca(data, cho)
    {
        //let cho = this.getChoice();
        let out = [];

        if(!Array.isArray(data)){data = Object.values(data);}

        data.forEach(element=>{
            if(cho.cat.indexOf(element.fields.category) != -1)
            {
                //console.log(element.pro,",",cho.sel);
                if((!cho.opt.star || element.star) && (!cho.opt.pro || (element.pro >= 0 && element.pro < cho.sel)))
                {
                    out.push(element);
                }  
            }
        });

        if(cho.opt.rnd){out.sort(() => Math.random() - 0.5);}
        return out;

    }

    static attachUrl(data)
    {
        if(!Array.isArray(data)) {data = Object.values(data);}
        data.forEach(e => {e.url = URL.createObjectURL(e.blob);});
    }

    static removeUrl(data)
    {
        data.forEach(url=>{URL.revokeObjectURL(url);})
    }

    static toDict_pk(data)
    {
        let dict = {};
        data.forEach(element=>{dict[element.pk] = element;});
        return dict;
    }

    static toDict_key(data)
    {
        let dict = {};
        data.forEach(element=>{dict[element.fields.key] = element;});
        return dict;
    }

    static info_debug()
    {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        const fontSize = styles.getPropertyValue('--font-size');
        console.log('--font-size:',fontSize);
    }

    static clamp(num, min, max)
    {
        return Math.min(Math.max(num, min), max);
    }

    static replace_br_with_label(data)
    {
        let splits = data.split('<br>')
        let out = "";
        console.log(splits);
        splits.forEach(split=>{
            if(split){out += `<label>${split}</label>`;}
        });
        return out;
    }

    static insert_label_before_br(data)
    {
        let splits = data.split('<br>')
        let out = "";
        console.log(splits);
        splits.forEach(split=>{
            if(split){out += `<label>${split}</label><br>`;}
        });
        return out;
    }

    static replace_brackets_with_label(data)
    {
        return data.replace(/\{/,'<label>').replace(/\}/,'</label>')
    }

    static isTimestamp(timestamp)
    {            
        return /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(timestamp);
    }

    static remove_redundent_space(str)
    {
        return str.trim().replace(/\s+/g, ' ');
    }

    static randomSort(array, count)
    {
        let out = [];
        count = count ? Math.min(count, array.length) : array.length;
        while(out.length < count)
        {
            let idx = Math.floor(Math.random()*array.length);
            out.push(array[idx]);
            array.splice(idx, 1);
        }
        return out;
    }

    static dict(voca)
    {
        return Voca.show( VocaDB.get(voca) );
    }

    static parse(text)
    {
        // {f:}         :           <div style="display:flex;align-items:center"></div>
        // {bWid:}      :           <div style="width:Wid></div>
        // {BWid:}      :           <div style="width:Wid;text-align:center"></div>
        
        // (:color:)    :   顏色    <label style="color:color">

        // [pWid:]      :   發音    <span style="width:Wid></span> 
        // [PWid:]      :   發音    <span style="width:Wid;text-align:center"></span> 
        // [d:]         :   查字典  <span dict="true"></span> 
        // [m:]         :   標記    <small class="mark"></small> 
        // [iWid:]      :   輸入    <input style="width:Wid">

        // !\n          :           刪除換行

        if(text == null){return '';}

        let fontSize = $(document.body).css('font-size').replace(/px/,'');

        function num(p) {return p.replace(/(\d+)$/g,(m,p)=>{return p+'px';});}

        function getLen(str)
        {
            let len = 0;

            let match = str.match(/\(.*?\)/g);

            if(match) {len = Utility.remove_redundent_space(str).replace(/\(.*?\)/g,'').length;}
            else {match = [Utility.remove_redundent_space(str)];}

            for(let i=0; i<match.length; i++)
            {
                let max = 0;
                let splits = match[i].replace(/[\(\)]/g,'').split(/[|/]/);
                splits.forEach((e)=>{max = Math.max(e.trim().length, max);});
                //console.log(match[i],',',max);
                len += max;
            }

            return len;
        }

        return text.replace(/{([^\d:\[\]]+)(\d+[^:]*)*:/g,(match, cmd, p)=>{
                        //console.log(`match=${match},cmd=${cmd},p=${p}`);
                        let wid = p ? num(p) : 'auto';
                        switch(cmd)
                        {
                            case 'f': return `<div style="display:flex;align-items:center">`;
                            case 'b': return `<div style="width:${wid}">`;;
                            case 'B': return `<div style="width:${wid};text-align:center;word-break:break-all">`;
                            
                        }
                        return match;
                    })
                    .replace(/:}/g, '</div>')
                    .replace(/\((\w*):/g,(match, color)=>{
                        //console.log(`match=${match},cmd=${color}`);
                        return `<label style="color:${color}">`;
                    })
                    .replace(/:\)/g, '</label>')
                    .replace(/\[([^\d:\[\]]+)(\d+[^:]*)*:([^\[\]]*)\]/g, (match, cmd, p, txt) => {
                        //console.log(`match=${match},cmd=${cmd},p=${p},txt=${txt}`);
                        let wid = p ? num(p) : 'auto';
                        switch(cmd)
                        {
                            case 'm': return `<small class="mark">${txt}</small>`;
                            case 'p': return `<span style="display:inline-block;width:${wid}">${txt}</span>`;
                            case 'P': return `<span style="display:inline-block;width:${wid};text-align:center">${txt}</span>`;
                            case 'l': return `<label style="display:inline-block;width:${wid}">${txt}</label>`;
                            case 'L': return `<label style="display:inline-block;width:${wid};text-align:center">${txt}</label>`;
                            case 'd': return `<span dict="true">${txt}</span>`;
                            case 'i':
                            {
                                let len = p ?? getLen(txt);
                                let wid = len*fontSize+'px';
                                return `<input type="text" answer="${txt}" style="width:${wid}" class="input-exam">`;
                            }
    
                        }
                    })
                    .replace(/!(\r\n|\n)/g,'')              // 刪除換行
                    .replace(/\r\n|\n|\\n/g,'<br>')         // 換行
                    .replace(/[^<>]*(?![^<>]*>)/g, (match)=>{return match.replace(/\s/g, '&ensp;')})  // 在<>外面的空白用&ensp;取代，(不要用&nbsp;否則無法換行)

    }
}

function delay(s)
{
    return new Promise(function(resolve) {setTimeout(resolve, s * 1000);});
}
