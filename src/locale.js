import {global} from './vars.js';

let strings;
getString(global.settings.locale);

export function loc(key, variables) {
    let string = strings[key];
    if (!string) {
        if (global.settings.expose){
            console.error(`string ${key} not found`);
            console.log(strings);
        }
        return key;
    }
    if (variables) {
        if (variables instanceof Array) {
            for (let i = 0; i < variables.length; i++) {
                let re = new RegExp(`%${i}(?!\\d)`, "g");
                if(!re.exec(string)){
                    if (global.settings.expose){
                        console.error(`"%${i}" was not found in the string "${key}" to be replace by "${variables[i]}"`);
                    }
                    continue;
                }
                string = string.replace(re, variables[i]);
            }
            let re = new RegExp("%\\d+(?!\\d)", 'g');
            const results = string.match(re);
            if(results && global.settings.expose){
                console.error(`${results} was found in the string, but there is no variables to make the replacement`);
            }
        }
        else {
            if (global.settings.expose){
                console.error('"variables" need be a instance of "Array"');
            }
        }
    }
    return string;
}

function getString(locale) {
    $.ajaxSetup({async: false, cache: false});

    let defaultString;
    $.getJSON("strings/strings.zh-CN.json", (data) => {
        defaultString = data;
    });

    if (locale != "en-US") {
        let localeString;
        try {
            $.getJSON(`strings/strings.${locale}.json`, (data) => {
                localeString = data;
            })
        }
        catch (e) {
            console.error(e, e.stack);
        }
        const defSize = defaultString.length;

        if (localeString) {
            Object.assign(defaultString, localeString);
        }

        if(defaultString.length != defSize && global.settings.expose){
            console.error(`string.${locale}.json has extra keys.`);
        }
    }

    $.ajaxSetup({async: true, cache: true});
    strings = defaultString;
}

export const locales = {
    'zh-CN': '简体中文 (CN)',
    'en-US': 'English (US)',
    'es-ES': 'Spanish (ESP)',
    'pt-BR': 'Português (BR)',
    'ko-KR': '한국어',
    'cs-CZ': 'Čeština',
    'ru-RU': 'Русский',
    'im-PL': 'Igpay-Atinlay'
};
