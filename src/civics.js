import { global, poppers, clearStates, save, keyMultiplier, sizeApproximation } from './vars.js';
import { loc } from './locale.js';
import { calcPrestige, clearElement, popover, vBind, tagEvent, modRes, messageQueue, genCivName, darkEffect, eventActive, easterEgg, trickOrTreat } from './functions.js';
import { unlockAchieve, unlockFeat, checkAchievements, universeAffix } from './achieve.js';
import { races, racialTrait, traits, planetTraits } from './races.js';
import { loadIndustry } from './industry.js';
import { drawTech } from  './actions.js';

// Sets up government in civics tab
export function defineGovernment(define){
    if (!global.civic['taxes']){
        global.civic['taxes'] = {
            tax_rate: 20,
            display: false
        };
    }

    if (define){
        return;
    }

    if (!global.settings.tabLoad && (global.settings.civTabs !== 2 || global.settings.govTabs !== 0)){
        return;
    }

    var govern = $('<div id="government" class="government is-child"></div>');
    govern.append($(`<div class="header" v-show="display"><h2 class="has-text-warning">${loc('civics_government')}</h2></div>`));
    $('#r_civics').append(govern);

    vBind({
        el: '#government .header',
        data: global.civic['taxes']
    });
    
    government(govern);
    taxRates(govern);

    var civ_garrison = $('<div id="c_garrison" v-show="g.display" class="garrison tile is-child"></div>');
    $('#r_civics').append(civ_garrison);
}


export function defineIndustry(){
    if (!global.settings.tabLoad && (global.settings.civTabs !== 2 || global.settings.govTabs !== 1)){
        return;
    }
    clearElement($('#industry'));

    if (global.city['smelter'] && (global.city.smelter.count > 0 || global.race['cataclysm'])){
        var smelter = $(`<div id="iSmelter" class="industry"><h2 class="header has-text-advanced">${loc('city_smelter')}</h2></div>`);
        $(`#industry`).append(smelter);
        loadIndustry('smelter',smelter,'#iSmelter');
    }
    if ((global.city['factory'] && global.city.factory.count > 0) || (global.space['red_factory'] && global.space.red_factory.count > 0)){
        var factory = $(`<div id="iFactory" class="industry"><h2 class="header has-text-advanced">${loc('city_factory')}</h2></div>`);
        $(`#industry`).append(factory);
        loadIndustry('factory',factory,'#iFactory');
    }
    if (global.interstellar['mining_droid'] && global.interstellar.mining_droid.count > 0){
        var droid = $(`<div id="iDroid" class="industry"><h2 class="header has-text-advanced">${loc('interstellar_mining_droid_title')}</h2></div>`);
        $(`#industry`).append(droid);
        loadIndustry('droid',droid,'#iDroid');
    }
    if (global.interstellar['g_factory'] && global.interstellar.g_factory.count > 0){
        var graphene = $(`<div id="iGraphene" class="industry"><h2 class="header has-text-advanced">${loc('interstellar_g_factory_title')}</h2></div>`);
        $(`#industry`).append(graphene);
        loadIndustry('graphene',graphene,'#iGraphene');
    }
    if (global.race['casting'] && global.city['pylon']){
        var casting = $(`<div id="iPylon" class="industry"><h2 class="header has-text-advanced">${loc('city_pylon')}</h2></div>`);
        $(`#industry`).append(casting);
        loadIndustry('pylon',casting,'#iPylon');
    }
    if (global.race['smoldering'] && global.city['rock_quarry']){
        var ratio = $(`<div id="iQuarry" class="industry"><h2 class="header has-text-advanced">${loc('city_rock_quarry')}</h2></div>`);
        $(`#industry`).append(ratio);
        loadIndustry('rock_quarry',ratio,'#iQuarry');
    }
}

// Sets up garrison in civics tab
export function defineGarrison(){
    commisionGarrison();

    if (!global.settings.tabLoad && (global.settings.civTabs !== 2 || global.settings.govTabs !== 3)){
        return;
    }

    var garrison = $('<div id="garrison" v-show="vis()" class="garrison tile is-child"></div>');
    $('#military').append(garrison);
    $('#military').append($(`<div id="fortress"></div>`));
    
    buildGarrison(garrison,true);
    defineMad();
}

export function commisionGarrison(){
    if (!global.civic['garrison']){
        global.civic['garrison'] = {
            display: false,
            disabled: false,
            progress: 0,
            tactic: 0,
            workers: 0,
            wounded: 0,
            raid: 0,
            max: 0
        };
    }

    if (!global.civic.garrison['mercs']){
        global.civic.garrison['mercs'] = false;
    }
    if (!global.civic.garrison['fatigue']){
        global.civic.garrison['fatigue'] = 0;
    }
    if (!global.civic.garrison['protest']){
        global.civic.garrison['protest'] = 0;
    }
    if (!global.civic.garrison['m_use']){
        global.civic.garrison['m_use'] = 0;
    }
    if (!global.civic.garrison['crew']){
        global.civic.garrison['crew'] = 0;
    }

    if (!global.civic['mad']){
        global.civic['mad'] = {
            display: false,
            armed: true
        };
    }
}

export function govTitle(id){
    if (typeof global.civic.foreign[`gov${id}`]['name'] == "undefined"){
        let nameFrags = genCivName();
        global.civic.foreign[`gov${id}`]['name'] = {
            s0: nameFrags.s0,
            s1: nameFrags.s1
        };
    }

    return loc(`civics_gov${global.civic.foreign[`gov${id}`].name.s0}`,[global.civic.foreign[`gov${id}`].name.s1]);
}

const government_desc = (function(){
    return {
        anarchy: loc('govern_anarchy_effect'),
        autocracy: loc('govern_autocracy_effect',[global.tech['high_tech'] && global.tech['high_tech'] >= 2 ? ( global.tech['high_tech'] >= 12 ? 10 : 18 ) : 25, 35]),
        democracy: loc('govern_democracy_effect',[global.tech['high_tech'] && global.tech['high_tech'] >= 2 ? ( global.tech['high_tech'] >= 12 ? 30 : 25 ) : 20, 5]),
        oligarchy: global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? loc('govern_oligarchy_effect_alt',[20]) : loc('govern_oligarchy_effect',[global.tech['high_tech'] && global.tech['high_tech'] >= 2 ? 2 : 5, 20]),
        theocracy: loc('govern_theocracy_effect',[12,25,global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 25 : 40 ) : 50]),
        theocracy_alt: loc('govern_theocracy_effect_alt',[12,25,global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 25 : 40 ) : 50]),
        republic: loc('govern_republic_effect',[25, global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 40 : 30 ) : 20]),
        socialist: loc('govern_socialist_effect',[global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 50 : 42 ) : 35, 10,10,20]),
        corpocracy: loc('govern_corpocracy_effect',[200,150,100, global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? 5 : 10, global.tech['high_tech'] && global.tech['high_tech'] >= 16 ? 40 : 30]),
        technocracy: global.tech['high_tech'] && global.tech['high_tech'] >= 16 ? loc('govern_technocracy_effect_alt',[8,10]) : loc('govern_technocracy_effect',[8, global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? 1 : 2, 10]),
        federation: loc('govern_federation_effect',[3,10]),
        federation_alt: loc('govern_federation_effect_alt',[25, global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 40 : 36 ) : 32, 10]),
        magocracy: loc('govern_magocracy_effect',[25, global.tech['high_tech'] && global.tech['high_tech'] >= 12 ? ( global.tech['high_tech'] >= 16 ? 50 : 40 ) : 25]),
    };
});

function government(govern){
    var gov = $('<div id="govType" class="govType" v-show="vis()"></div>');
    govern.append(gov);
    
    var type = $(`<div>${loc('civics_government_type')} <span id="govLabel" class="has-text-warning">{{ type | govern }}</span></div>`);
    gov.append(type);
    
    var setgov = $(`<div></div>`);
    gov.append(setgov);

    var change = $(`<span class="change inline"><button class="button" @click="trigModal" :disabled="rev > 0">{{ type | set }}</button></span>`);
    setgov.append(change);

    var modal = {
        template: '<div id="modalBox" class="modalBox"></div>'
    };

    vBind({
        el: '#govType',
        data: global.civic['govern'],
        filters: {
            govern(type){
                return loc(`govern_${type}`);
            },
            set(g){
                return g === 'anarchy' ? loc('civics_set_gov') : loc('civics_revolution');
            }
        },
        methods: {
            trigModal(){
                this.$buefy.modal.open({
                    parent: this,
                    component: modal
                });

                var checkExist = setInterval(function() {
                   if ($('#modalBox').length > 0) {
                      clearInterval(checkExist);
                      drawGovModal();
                   }
                }, 50);
            },
            startrev(){
                global.civic.govern.fr = global.civic.govern.rev;
                global.civic.govern.rev = 0;
            },
            force(){                
                return global.civic.govern.rev > 0 ? loc('civics_force_rev_desc') : loc('civics_force_rev_desc2');
            },
            vis(){
                return global.tech['govern'] ? true : false;
            }
        }
    });

    popover('govLabel', function(){
            let effect_type = global.tech['unify'] && global.tech['unify'] >= 2 && global.civic.govern.type === 'federation' ? 'federation_alt' : global.civic.govern.type;
            if (effect_type === 'theocracy' && global.genes['ancients'] && global.genes['ancients'] >= 2 && global.civic.priest.display){
                effect_type = 'theocracy_alt';
            }
            return $(`<div>${loc(`govern_${global.civic.govern.type}_desc`)}</div><div class="has-text-advanced">${government_desc()[effect_type]}</div>`);
        }
    );

    popover(`govTypeChange`, function(){
            return global.civic.govern.rev > 0 ? loc('civics_change_desc',[global.civic.govern.rev]) : loc('civics_change_desc2');
        },
        {
            elm: `#govType .change`
        }
    );
}

function drawGovModal(){
    $('#modalBox').append($(`<p id="modalBoxTitle" class="has-text-warning modalTitle">${loc('civics_government_type')}</p>`));
    let egg = easterEgg(6,10);
    if (egg.length > 0){
        $('#modalBoxTitle').append(egg);
    }
    let trick = trickOrTreat(6,14);
    if (trick.length > 0){
        $('#modalBoxTitle').append(trick);
    }
    
    var body = $('<div id="govModal" class="modalBody max40"></div>');
    $('#modalBox').append(body);

    if (global.tech['govern']){
        if (global.civic.govern.type !== 'autocracy'){
            body.append($(`<button class="button gap" data-gov="autocracy" @click="setGov('autocracy')">${loc(`govern_autocracy`)}</button>`));
        }
        if (global.civic.govern.type !== 'democracy'){
            body.append($(`<button class="button gap" data-gov="democracy" @click="setGov('democracy')">${loc(`govern_democracy`)}</button>`));
        }
        if (global.civic.govern.type !== 'oligarchy'){
            body.append($(`<button class="button gap" data-gov="oligarchy" @click="setGov('oligarchy')">${loc(`govern_oligarchy`)}</button>`));
        }
        if (global.tech['gov_theo'] && global.civic.govern.type !== 'theocracy'){
            body.append($(`<button class="button gap" data-gov="theocracy" @click="setGov('theocracy')">${loc(`govern_theocracy`)}</button>`));
        }
        if (global.tech['govern'] >= 2 && global.civic.govern.type !== 'republic'){
            body.append($(`<button class="button gap" data-gov="republic" @click="setGov('republic')">${loc(`govern_republic`)}</button>`));
        }
        if (global.tech['gov_soc'] && global.civic.govern.type !== 'socialist'){
            body.append($(`<button class="button gap" data-gov="socialist" @click="setGov('socialist')">${loc(`govern_socialist`)}</button>`));
        }
        if (global.tech['gov_corp'] && global.civic.govern.type !== 'corpocracy'){
            body.append($(`<button class="button gap" data-gov="corpocracy" @click="setGov('corpocracy')">${loc(`govern_corpocracy`)}</button>`));
        }
        if (global.tech['govern'] >= 3 && global.civic.govern.type !== 'technocracy'){
            body.append($(`<button class="button gap" data-gov="technocracy" @click="setGov('technocracy')">${loc(`govern_technocracy`)}</button>`));
        }
        if (global.tech['gov_fed'] && global.civic.govern.type !== 'federation'){
            body.append($(`<button class="button gap" data-gov="federation" @click="setGov('federation')">${loc(`govern_federation`)}</button>`));
        }
        if (global.tech['gov_mage'] && global.civic.govern.type !== 'magocracy'){
            body.append($(`<button class="button gap" data-gov="magocracy" @click="setGov('magocracy')">${loc(`govern_magocracy`)}</button>`));
        }
    }

    vBind({
        el: '#govModal',
        data: global.civic['govern'],
        methods: {
            setGov(g){
                if (global.civic.govern.rev === 0){
                    global.civic.govern.type = g;
                    let time = 1000;
                    if (global.tech['high_tech']){
                        time += 250;
                        if (global.tech['high_tech'] >= 3){
                            time += 250;
                        }
                        if (global.tech['high_tech'] >= 6){
                            time += 250;
                        }
                    }
                    if (global.tech['space_explore'] && global.tech['space_explore'] >= 3){
                        time += 250;
                    }
                    if (global.race['unorganized']){
                        time = Math.round(time * (1 + traits.unorganized.vars[0] / 100));
                    }
                    if (global.stats.achieve['anarchist']){
                        time = Math.round(time * (1 - (global.stats.achieve['anarchist'].l / 10)));
                    }
                    if (global.race['lawless']){
                        time = Math.round(time / (100 - traits.lawless.vars[0]));
                    }
                    global.civic.govern.rev = time + global.civic.govern.fr;
                    vBind({el: '#govModal'},'destroy');
                    $('.modal-background').click();
                    $('#popGovPop').hide();
                    poppers['GovPop'].destroy();
                    clearElement($(`#popGovPop`),true);

                    setTimeout(function(){
                        $('#popGovPop').hide();
                        if (poppers['GovPop']){
                            poppers['GovPop'].destroy();
                        }                        
                        clearElement($(`#popGovPop`),true);
                    },250);
                }
            }
        }
    });

    popover('GovPop', function(obj){
            let govType = $(obj.this).data('gov');
            let effectType = global.tech['unify'] && global.tech['unify'] >= 2 && govType === 'federation' ? 'federation_alt' : govType;
            if (effectType === 'theocracy' && global.genes['ancients'] && global.genes['ancients'] >= 2 && global.civic.priest.display){
                effectType = 'theocracy_alt';
            }
            return $(`<div>${loc(`govern_${govType}_desc`)}</div><div class="has-text-advanced">${government_desc()[effectType]}</div>`);
        },
        {
            elm: `#govModal button`,
            self: true,
            classes: `has-background-light has-text-dark`
        }
    );
}

export function foreignGov(){
    if ($('#foreign').length === 0 && !global.race['cataclysm'] && !global.tech['world_control']){
        let foreign = $('<div id="foreign" v-show="vis()" class="government is-child"></div>');
        foreign.append($(`<div class="header"><h2 class="has-text-warning">${loc('civics_foreign')}</h2></div>`));
        $('#r_civics').append(foreign);

        var modal = {
            template: '<div id="modalBox" class="modalBox"></div>'
        };

        for (let i=0;i<3;i++){
            let gov = $(`<div id="gov${i}" class="foreign"><span class="has-text-caution">{{ '${i}' | gov }}</span><span v-if="f${i}.occ" class="has-text-advanced"> - ${loc('civics_garrison_occupy')}</span><span v-else-if="f${i}.anx" class="has-text-advanced"> - ${loc('civics_garrison_annex')}</span></span><span v-else-if="f${i}.buy" class="has-text-advanced"> - ${loc('civics_garrison_purchase')}</span></div>`);
            foreign.append(gov);

            let actions = $(`<div></div>`);
            actions.append($(`<b-tooltip :label="battleAssessment(${i})" position="is-bottom" multilined animated><button class="button gaction" @click="campaign(${i})"><span v-show="!f${i}.occ && !f${i}.anx && !f${i}.buy">${loc('civics_garrison_attack')}</span><span v-show="f${i}.occ || f${i}.anx || f${i}.buy">${loc('civics_garrison_unoccupy')}</span></button></b-tooltip>`));
            actions.append($(`<b-tooltip v-show="t.spy >= 1 && !f${i}.occ && !f${i}.anx && !f${i}.buy" :label="spyDesc(${i})" position="is-bottom" animated multilined><button :disabled="spy_disabled(${i})" class="button gaction" @click="spy(${i})"><span v-show="f${i}.trn === 0">${loc('tech_spy')}: {{ f${i}.spy }}</span><span v-show="f${i}.trn > 0">${loc('civics_train')}: {{ f${i}.trn }}</span></button></b-tooltip>`));
            actions.append($(`<b-tooltip v-show="t.spy >= 2 && !f${i}.occ && !f${i}.anx && !f${i}.buy && f${i}.spy >= 1" :label="espDesc()" position="is-bottom" animated multilined><button :disabled="f${i}.sab > 0" class="button gaction" @click="trigModal(${i})"><span v-show="f${i}.sab === 0">${loc('tech_espionage')}</span><span v-show="f${i}.sab > 0">{{ f${i}.act | sab }}: {{ f${i}.sab }}</span></button></b-tooltip>`));
            gov.append(actions);

            gov.append($(`<div v-show="!f${i}.occ && !f${i}.anx && !f${i}.buy"><span class="has-text-advanced glabel">${loc('civics_gov_mil_rate')}:</span> <span class="glevel">{{ f${i}.mil | military(${i}) }}<span class="has-text-warning" v-show="f${i}.spy >= 2"> ({{ f${i}.mil }})</span></span></div>`));
            gov.append($(`<div v-show="!f${i}.occ && !f${i}.anx && !f${i}.buy"><span class="has-text-advanced glabel">${loc('civics_gov_relations')}:</span> <span class="glevel">{{ f${i}.hstl | relation }}<span class="has-text-warning" v-show="f${i}.spy >= 1"> ({{ f${i}.hstl | hate }})</span></span></div>`));
            gov.append($(`<div v-show="!f${i}.occ && !f${i}.anx && !f${i}.buy"><span class="has-text-advanced glabel">${loc('civics_gov_eco_rate')}:</span> <span class="glevel">{{ f${i}.eco | eco(${i}) }}<span class="has-text-warning" v-show="f${i}.spy >= 3"> ({{ f${i}.eco }})</span></span></div>`));
            gov.append($(`<div v-show="f${i}.spy >= 2 && !f${i}.occ && !f${i}.anx && !f${i}.buy"><span class="has-text-advanced glabel">${loc('civics_gov_unrest')}:</span> <span class="glevel">{{ f${i}.unrest | discontent(${i}) }}<span class="has-text-warning" v-show="f${i}.spy >= 4"> ({{ f${i}.unrest | turmoil }})</span></span></div>`));
        }

        vBind({
            el: `#foreign`,
            data: {
                f0: global.civic.foreign[`gov0`],
                f1: global.civic.foreign[`gov1`],
                f2: global.civic.foreign[`gov2`],
                t: global.tech
            },
            filters: {
                military(m,i){
                    if (global.civic.foreign[`gov${i}`].spy >= 1){
                        if (m < 50){
                            return loc('civics_gov_v_weak');
                        }
                        else if (m < 75){
                            return loc('civics_gov_weak');
                        }
                        else if (m > 200){
                            return loc('civics_gov_superpower');
                        }
                        else if (m > 160){
                            return loc('civics_gov_v_strong');
                        }
                        else if (m > 125){
                            return loc('civics_gov_strong');
                        }
                        else {
                            return loc('civics_gov_average');
                        }
                    }
                    else {
                        return '???';
                    }
                },
                relation(r){
                    if (r > 80){
                        return loc('civics_gov_hated');
                    }
                    else if (r > 60){
                        return loc('civics_gov_hostile');
                    }
                    else if (r > 40){
                        return loc('civics_gov_poor');
                    }
                    else if (r > 25){
                        return loc('civics_gov_neutral');
                    }
                    else if (r > 10){
                        return loc('civics_gov_liked');
                    }
                    else {
                        return loc('civics_gov_good');
                    }
                },
                eco(e,i){
                    if (global.civic.foreign[`gov${i}`].spy >= 2){
                        if (e < 60){
                            return loc('civics_gov_weak');
                        }
                        else if (e < 80){
                            return loc('civics_gov_recession');
                        }
                        else if (e > 120){
                            return loc('civics_gov_strong');
                        }
                        else {
                            return loc('civics_gov_average');
                        }
                    }
                    else {
                        return '???';
                    }
                },
                discontent(r,i){
                    if (global.civic.foreign[`gov${i}`].spy >= 3){
                        if (r <= 0){
                            return loc('civics_gov_none');
                        }
                        else if (r < 30){
                            return loc('civics_gov_low');
                        }
                        else if (r < 60){
                            return loc('civics_gov_medium');
                        }
                        else if (r < 90){
                            return loc('civics_gov_high');
                        }
                        else {
                            return loc('civics_gov_extreme');
                        }
                    }
                    else {
                        return '???';
                    }
                },
                gov(id){
                    return govTitle(id);
                },
                sab(s){
                    return s === 'none' ? '' : loc(`civics_spy_${s}`);
                },
                hate(h){
                    return `${100 - h}%`;
                },
                turmoil(u){
                    return `${u}%`;
                }
            },
            methods: {
                campaign(gov){
                    war_campaign(gov);
                },
                battleAssessment(gov){
                    return battleAssessment(gov);
                },
                trigModal(i){
                    this.$buefy.modal.open({
                        parent: this,
                        component: modal
                    });

                    var checkExist = setInterval(function() {
                    if ($('#modalBox').length > 0) {
                        clearInterval(checkExist);
                        drawEspModal(i);
                    }
                    }, 50);
                },
                spy_disabled(i){
                    return global.civic.foreign[`gov${i}`].trn > 0 || spyCost(i) > global.resource.Money.amount ? true : false;
                },
                spy(i){
                    if (global.tech['spy'] && global.civic.foreign[`gov${i}`].trn === 0){
                        let cost = spyCost(i)
                        if (global.resource.Money.amount >= cost){
                            global.resource.Money.amount -= cost;
                            let time = 300;
                            if (global.tech['spy'] >= 3 && global.city['boot_camp']){
                                time -= global.city['boot_camp'].count * 10;                            
                                if (time < 10){
                                    time = 10;
                                }                            
                            }
                            if (global.race['infiltrator']){
                                time = Math.round(time / 2);
                            }
                            global.civic.foreign[`gov${i}`].trn = time;
                        }
                    }
                },
                spyDesc(i){
                    if (global.civic.foreign[`gov${i}`].trn > 0){
                        return loc('civics_progress');
                    }
                    let cost = sizeApproximation(spyCost(i));
                    return loc('civics_gov_spy_desc',[cost]);
                },
                espDesc(){
                    return loc('civics_gov_esp_desc');
                },
                vis(){
                    return global.civic.garrison.display && !global.tech['world_control'] && !global.race['cataclysm'] ? true : false;
                }
            }
        });
    }
}

function spyCost(i){
    let base = Math.round((global.civic.foreign[`gov${i}`].mil / 2) + (global.civic.foreign[`gov${i}`].hstl / 2) - global.civic.foreign[`gov${i}`].unrest) + 10;
    if (base < 50){
        base = 50;
    }
    if (global.race['infiltrator']){
        base /= 3;
    }
    return Math.round(base ** (global.civic.foreign[`gov${i}`].spy + 1)) + 500;
}

function govPrice(gov){
    let price = global.civic.foreign[`gov${gov}`].eco * 15384;
    price *= 1 + global.civic.foreign[`gov${gov}`].hstl * 1.6 / 100;
    price *= 1 - global.civic.foreign[`gov${gov}`].unrest * 0.25 / 100;
    return +price.toFixed(0);
}
    
export function checkControlling() {
    return global.civic.foreign.gov0.occ || global.civic.foreign.gov1.occ || global.civic.foreign.gov2.occ || global.civic.foreign.gov0.anx || global.civic.foreign.gov1.anx || global.civic.foreign.gov2.anx || global.civic.foreign.gov0.buy || global.civic.foreign.gov1.buy || global.civic.foreign.gov2.buy;
}

function drawEspModal(gov){
    $('#modalBox').append($(`<p id="modalBoxTitle" class="has-text-warning modalTitle">${loc('civics_espionage_actions')}</p>`));
    
    var body = $('<div id="espModal" class="modalBody max40"></div>');
    $('#modalBox').append(body);

    if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${gov}`].spy >= 1){
        body.append($(`<button class="button gap" data-esp="influence" @click="influence('${gov}')">${loc(`civics_spy_influence`)}</button>`));
        body.append($(`<button class="button gap" data-esp="sabotage" @click="sabotage('${gov}')">${loc(`civics_spy_sabotage`)}</button>`));
        body.append($(`<button class="button gap" data-esp="incite" @click="incite('${gov}')">${loc(`civics_spy_incite`)}</button>`));
        if (global.civic.foreign[`gov${gov}`].hstl <= 50 && global.civic.foreign[`gov${gov}`].unrest >= 50){
            body.append($(`<button class="button gap" data-esp="annex" @click="annex('${gov}')">${loc(`civics_spy_annex`)}</button>`));
        }
        if (global.civic.foreign[`gov${gov}`].spy >= 3){
            body.append($(`<button class="button gap" data-esp="purchase" @click="purchase('${gov}')">${loc(`civics_spy_purchase`)}</button>`));
        }
    }

    vBind({
        el: '#espModal',
        data: global.civic.foreign[`gov${gov}`],
        methods: {
            influence(g){
                if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${g}`].spy >= 1){
                    let timer = global.tech['spy'] >= 4 ? 200 : 300;
                    global.civic.foreign[`gov${g}`].sab = global.race['befuddle'] ? (timer / 2) : timer;
                    global.civic.foreign[`gov${g}`].act = 'influence';
                    vBind({el: '#espModal'},'destroy');
                    $('.modal-background').click();
                    $('#popGovLabel').hide();
                    poppers['GovLabel'].destroy();
                    clearElement($('#popGovLabel'),true);

                    setTimeout(function(){
                        $('#popGovLabel').hide();
                        poppers['GovLabel'].destroy();
                        clearElement($('#popGovLabel'),true);
                    },250);
                }
            },
            sabotage(g){
                if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${g}`].spy >= 1){
                    let timer = global.tech['spy'] >= 4 ? 400 : 600;
                    global.civic.foreign[`gov${g}`].sab = global.race['befuddle'] ? (timer / 2) : timer;
                    global.civic.foreign[`gov${g}`].act = 'sabotage';
                    vBind({el: '#espModal'},'destroy');
                    $('.modal-background').click();
                    $('#popGov').hide();
                    $('#popGovLabel').hide();
                    poppers['GovLabel'].destroy();
                    clearElement($('#popGovLabel'),true);

                    setTimeout(function(){
                        $('#popGovLabel').hide();
                        poppers['GovLabel'].destroy();
                        clearElement($('#popGovLabel'),true);
                    },250);
                }
            },
            incite(g){
                if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${g}`].spy >= 1){
                    let timer = global.tech['spy'] >= 4 ? 600 : 900;
                    global.civic.foreign[`gov${g}`].sab = global.race['befuddle'] ? (timer / 2) : timer;
                    global.civic.foreign[`gov${g}`].act = 'incite';
                    vBind({el: '#espModal'},'destroy');
                    $('.modal-background').click();
                    $('#popGovLabel').hide();
                    poppers['GovLabel'].destroy();
                    clearElement($('#popGovLabel'),true);

                    setTimeout(function(){
                        $('#popGovLabel').hide();
                        poppers['GovLabel'].destroy();
                        clearElement($('#popGovLabel'),true);
                    },250);
                }
            },
            annex(g){
                if (global.civic.foreign[`gov${gov}`].hstl <= 50 && global.civic.foreign[`gov${gov}`].unrest >= 50 && global.city.morale.current >= (200 + global.civic.foreign[`gov${gov}`].hstl - global.civic.foreign[`gov${gov}`].unrest)){
                    if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${g}`].spy >= 1){
                        let timer = global.tech['spy'] >= 4 ? 150 : 300;
                        global.civic.foreign[`gov${g}`].sab = global.race['befuddle'] ? (timer / 2) : timer;
                        global.civic.foreign[`gov${g}`].act = 'annex';
                        vBind({el: '#espModal'},'destroy');
                        $('.modal-background').click();
                        $('#popGovLabel').hide();
                        poppers['GovLabel'].destroy();
                        clearElement($('#popGovLabel'),true);

                        setTimeout(function(){
                            $('#popGovLabel').hide();
                            poppers['GovLabel'].destroy();
                            clearElement($('#popGovLabel'),true);
                        },250);
                    }
                }
            },
            purchase(g){
                let price = govPrice(g);
                if (price <= global.resource.Money.amount){
                    if (global.tech['spy'] && global.tech['spy'] >= 2 && global.civic.foreign[`gov${g}`].spy >= 3){
                        global.resource.Money.amount -= price;
                        let timer = global.tech['spy'] >= 4 ? 150 : 300;
                        global.civic.foreign[`gov${g}`].sab = global.race['befuddle'] ? (timer / 2) : timer;
                        global.civic.foreign[`gov${g}`].act = 'purchase';
                        vBind({el: '#espModal'},'destroy');
                        $('.modal-background').click();
                        $('#popGovLabel').hide();
                        poppers['GovLabel'].destroy();
                        clearElement($('#popGovLabel'),true);

                        setTimeout(function(){
                            $('#popGovLabel').hide();
                            poppers['GovLabel'].destroy();
                            clearElement($('#popGovLabel'),true);
                        },250);
                    }
                }
            }
        }
    });

    popover('GovLabel', function(obj){
            let esp = $(obj.this).data('esp');
            let desc = '';
            if (esp === 'purchase'){
                let price = govPrice(gov).toLocaleString();
                desc = loc(`civics_spy_${esp}_desc`,[govTitle(gov),price])
            }
            else if (esp === 'annex'){
                if (global.city.morale.current >= (200 + global.civic.foreign[`gov${gov}`].hstl - global.civic.foreign[`gov${gov}`].unrest)){
                    desc = loc(`civics_spy_${esp}_desc`,[govTitle(gov)]);
                }
                else {
                    let morale = 200 + global.civic.foreign[`gov${gov}`].hstl - global.civic.foreign[`gov${gov}`].unrest
                    desc = loc(`civics_spy_${esp}_goal`,[govTitle(gov),morale]);
                }
            }
            else {
                desc = loc(`civics_spy_${esp}_desc`,[govTitle(gov)]);
            }
            
            let warn = '';
            if (
                (esp === 'influence' && global.civic.foreign[`gov${gov}`].hstl === 0) || 
                (esp === 'sabotage' && global.civic.foreign[`gov${gov}`].spy >= 2 && global.civic.foreign[`gov${gov}`].mil === 50) || 
                (esp === 'incite' && global.civic.foreign[`gov${gov}`].spy >= 4 && global.civic.foreign[`gov${gov}`].unrest === 100)
            ){
                warn = `<div class="has-text-danger">${loc(`civics_spy_warning`)}</div>`;
            }
            return $(`${warn}<div>${desc}</div>`);
        },
        {
            elm: `#espModal button`,
            self: true,
            classes: `has-background-light has-text-dark`
        }
    );
}

function taxRates(govern){
    var tax_rates = $('<div id="tax_rates" v-show="display" class="taxRate"></div>');
    govern.append(tax_rates);
    
    var label = $(`<h3 id="taxRateLabel">${loc('civics_tax_rates')}</h3>`);
    tax_rates.append(label);
    
    var tax_level = $('<span class="current" v-html="$options.filters.tax_level(tax_rate)"></span>');
    var sub = $(`<span role="button" aria-label="decrease taxes" class="sub has-text-success" @click="sub">&laquo;</span>`);
    var add = $(`<span role="button" aria-label="increase taxes" class="add has-text-danger" @click="add">&raquo;</span>`);
    tax_rates.append(sub);
    tax_rates.append(tax_level);
    tax_rates.append(add);
    
    vBind({
        el: '#tax_rates',
        data: global.civic['taxes'],
        filters: {
            tax_level(rate){
                let egg = easterEgg(11,14);
                let trick = trickOrTreat(2,14);
                if (rate === 0 && egg.length > 0){
                    return egg;
                }
                else if (rate === 13 && trick.length > 0){
                    return trick;
                }
                else {
                    return `${rate}%`;
                }
            }
        },
        methods: {
            add(){
                let inc = keyMultiplier();
                let extreme = global.tech['currency'] && global.tech['currency'] >= 5 ? true : false;
                let cap = global.civic.govern.type === 'oligarchy' ? 50 : 30;
                if (extreme || global.race['terrifying']){
                    cap += 20;
                }
                if (global.race['noble']){
                    global.civic.taxes.tax_rate += inc;
                    if (global.civic.taxes.tax_rate > (global.civic.govern.type === 'oligarchy' ? 40 : 20)){
                        global.civic.taxes.tax_rate = global.civic.govern.type === 'oligarchy' ? 40 : 20;
                    }
                }
                else if (global.civic.taxes.tax_rate < cap){
                    global.civic.taxes.tax_rate += inc;
                    if (global.civic.taxes.tax_rate > cap){
                        global.civic.taxes.tax_rate = cap;
                    }
                }
            },
            sub(){
                let dec = keyMultiplier();
                let extreme = global.tech['currency'] && global.tech['currency'] >= 5 ? true : false;
                if (global.race['noble']){
                    global.civic.taxes.tax_rate -= dec;
                    if (global.civic.taxes.tax_rate < 10){
                        global.civic.taxes.tax_rate = 10;
                    }
                }
                else if ((extreme || global.race['terrifying']) && global.civic.taxes.tax_rate > 0){
                    global.civic.taxes.tax_rate -= dec;
                    if (global.civic.taxes.tax_rate < 0){
                        global.civic.taxes.tax_rate = 0;
                    }
                }
                else if (global.civic.taxes.tax_rate > 10){
                    global.civic.taxes.tax_rate -= dec;
                    if (global.civic.taxes.tax_rate < 10){
                        global.civic.taxes.tax_rate = 10;
                    }
                }
            }
        }
    });
    
    popover('taxRateLabel', function(){
            return loc('civics_tax_rates_desc');
        },
        {
            classes: `has-background-light has-text-dark`
        }
    );
}

export function buildGarrison(garrison,full){
    clearElement(garrison);
    if (global.tech['world_control']){
        garrison.append($(`<div class="header"><h2 class="has-text-warning">${loc('civics_garrison')}</h2> - <span class="has-text-success">${loc('rating')} <span class="defenseRating">{{ g.workers | hell | rating }}</span></div>`));
    }
    else {
        garrison.append($(`<div class="header"><h2 class="has-text-warning">${loc('civics_garrison')}</h2> - <span class="has-text-success">${loc('rating')} <span class="defenseRating">{{ g.workers | hell | rating }}</span> / <span class="offenseRating">{{ g.raid | rating }}</span></span></div>`));
    }

    var barracks = $('<div class="columns is-mobile bunk"></div>');
    garrison.append(barracks);

    var bunks = $('<div class="bunks"></div>');
    barracks.append(bunks);
    let soldier_title = global.tech['world_control'] ? loc('civics_garrison_peacekeepers') : loc('civics_garrison_soldiers');
    
    bunks.append($(`<div class="barracks"><span class="soldier">${soldier_title}</span> <span v-html="$options.filters.stationed(g.workers)"></span> / <span>{{ g.max | s_max }}<span></div>`));
    bunks.append($(`<div class="barracks" v-show="g.crew > 0"><span class="crew">${loc('civics_garrison_crew')}</span> <span>{{ g.crew }}</span></div>`));
    bunks.append($(`<div class="barracks"><span class="wounded">${loc('civics_garrison_wounded')}</span> <span v-html="$options.filters.wounded(g.wounded)"></span></div>`));

    barracks.append($(`<div class="hire"><button v-show="g.mercs" class="button first hmerc" @click="hire">${loc('civics_garrison_hire_mercenary')}</button><div>`));
    
    if (full){
        garrison.append($(`<div class="training"><span>${loc('civics_garrison_training')}</span> <progress class="progress" :value="g.progress" max="100">{{ g.progress }}%</progress></div>`));
    }

    var campaign = $('<div class="columns is-mobile battle"></div>');
    garrison.append(campaign);

    var wrap = $('<div class="war"></div>');
    campaign.append(wrap);

    if (!global.tech['world_control'] && !global.race['cataclysm']){
        var tactics = $(`<div id="${full ? 'tactics' : 'c_tactics'}" v-show="g.display" class="tactics"><span>${loc('civics_garrison_campaign')}</span></div>`);
        wrap.append(tactics);
            
        var strategy = $('<span class="current tactic">{{ g.tactic | tactics }}</span>');
        var last = $('<span role="button" aria-label="easier campaign" class="sub" @click="last">&laquo;</span>');
        var next = $('<span role="button" aria-label="harder campaign" class="add" @click="next">&raquo;</span>');
        tactics.append(last);
        tactics.append(strategy);
        tactics.append(next);

        var battalion = $(`<div id="${full ? 'battalion' : 'c_battalion'}" v-show="g.display" class="tactics"><span>${loc('civics_garrison_battalion')}</span></div>`);
        wrap.append(battalion);
            
        var armysize = $('<span class="current bat">{{ g.raid }}</span>');
        var alast = $('<span role="button" aria-label="remove soldiers from campaign" class="sub" @click="aLast">&laquo;</span>');
        var anext = $('<span role="button" aria-label="add soldiers to campaign" class="add" @click="aNext">&raquo;</span>');
        battalion.append(alast);
        battalion.append(armysize);
        battalion.append(anext);

        if (full){
            campaign.append($(`<div class="launch"><div class="has-text-caution">${govTitle(0)}</div><button class="button campaign gov0" @click="campaign(0)"><span v-show="!g0.occ && !g0.anx && !g0.buy">${loc('civics_garrison_launch_campaign')}</span><span v-show="g0.occ || g0.anx || g0.buy">${loc('civics_garrison_deoccupy')}</span></button></div>`));
            campaign.append($(`<div class="launch"><div class="has-text-caution">${govTitle(1)}</div><button class="button campaign gov1" @click="campaign(1)"><span v-show="!g1.occ && !g1.anx && !g1.buy">${loc('civics_garrison_launch_campaign')}</span><span v-show="g1.occ || g1.anx || g1.buy">${loc('civics_garrison_deoccupy')}</span></button></div>`));
            campaign.append($(`<div class="launch"><div class="has-text-caution">${govTitle(2)}</div><button class="button campaign gov2" @click="campaign(2)"><span v-show="!g2.occ && !g2.anx && !g2.buy">${loc('civics_garrison_launch_campaign')}</span><span v-show="g2.occ || g2.anx || g2.buy">${loc('civics_garrison_deoccupy')}</span></button></div>`));
        }
    }

    vBind({
        el: full ? '#garrison' : '#c_garrison',
        data: { 
            g: global.civic.garrison,
            g0: global.civic.foreign.gov0,
            g1: global.civic.foreign.gov1,
            g2: global.civic.foreign.gov2,
        },
        methods: {
            hire(){
                if (global.tech['mercs']){
                    let repeats = keyMultiplier();
                    let canBuy = true;
                    while (canBuy && repeats > 0){
                        let cost = Math.round((1.24 ** global.civic.garrison.workers) * 75) - 50;
                        if (cost > 25000){
                            cost = 25000;
                        }
                        if (global.civic.garrison.m_use > 0){
                            cost *= 1.1 ** global.civic.garrison.m_use;
                        }
                        if (global.race['brute']){
                            cost *= 1 - (traits.brute.vars[0] / 100);
                        }
                        cost = Math.round(cost);
                        if (global.civic['garrison'].workers < global.civic['garrison'].max && global.resource.Money.amount >= cost){
                            global.resource.Money.amount -= cost;
                            global.civic['garrison'].workers++;
                            global.civic.garrison.m_use++;
                        }
                        else {
                            canBuy = false;
                        }
                        repeats--;
                    }
                }
            },
            campaign(gov){
                war_campaign(gov);
            },
            next(){
                if (global.civic.garrison.tactic < 4){
                    global.civic.garrison.tactic++; 
                }
            },
            last(){
                if (global.civic.garrison.tactic > 0){
                    global.civic.garrison.tactic-- 
                }
            },
            aNext(){
                let inc = keyMultiplier();
                if (global.civic.garrison.raid < garrisonSize()){
                    global.civic.garrison.raid += inc;
                    if (global.civic.garrison.raid > garrisonSize()){
                        global.civic.garrison.raid = garrisonSize();
                    }
                }
            },
            aLast(){
                let dec = keyMultiplier();
                if (global.civic.garrison.raid > 0){
                    global.civic.garrison.raid -= dec;
                    if (global.civic.garrison.raid < 0){
                        global.civic.garrison.raid = 0;
                    }
                }
            },
            vis(){
                return global.civic.garrison.display;
            }
        },
        filters: {
            tactics(val){
                switch(val){
                    case 0:
                        return loc('civics_garrison_tactic_ambush');
                    case 1:
                        return loc('civics_garrison_tactic_raid');
                    case 2:
                        return loc('civics_garrison_tactic_pillage');
                    case 3:
                        return loc('civics_garrison_tactic_assault');
                    case 4:
                        return loc('civics_garrison_tactic_siege');
                }
            },
            rating(v){
                return +armyRating(v,'army').toFixed(1);
            },
            hell(v){
                return garrisonSize();
            },
            stationed(v){
                let size = garrisonSize();
                let trickNum = global.race['cataclysm'] ? 13 : 31;
                let trick = size === trickNum && !full ? trickOrTreat(8,14) : false;
                return size === trickNum && trick.length > 0 ? trick : size;
            },
            s_max(v){
                return garrisonSize(true);
            },
            wounded(w){
                let egg = easterEgg(8,12);
                if (full && w === 0 && egg.length > 0){
                    return egg;
                }
                return eventActive('fool',2021) ? garrisonSize() - w : w;
            }
        }
    });

    ['tactic','bat','soldier','crew','wounded','hmerc','defenseRating','offenseRating'].forEach(function(k){
        popover(full ? `garrison${k}` : `cGarrison${k}`,
            function(){ return '<span>{{ label() }}</span>'; },
            {
                elm: `${full ? '#garrison' : '#c_garrison'} .${k}`,
                in: function(obj){
                    vBind({
                        el: `#${obj.id} > span`,
                        data: { test: 'val' },
                        methods: {
                            label(){
                                switch(k){
                                    case 'tactic':
                                        {
                                            switch (global.civic.garrison.tactic){
                                                case 0:
                                                    return loc('civics_garrison_tactic_ambush_desc');
                                                case 1:
                                                    return loc('civics_garrison_tactic_raid_desc');
                                                case 2:
                                                    return loc('civics_garrison_tactic_pillage_desc');
                                                case 3:
                                                    return loc('civics_garrison_tactic_assault_desc');
                                                case 4:
                                                    return loc('civics_garrison_tactic_siege_desc',[global.civic.govern.type === 'federation' ? 15 : 20]);
                                            }
                                        }
                                    case 'bat':
                                        return loc('civics_garrison_army_label');
                                    case 'soldier':
                                        return describeSoldier();
                                    case 'crew':
                                        return loc('civics_garrison_crew_desc');
                                    case 'wounded':
                                        return loc('civics_garrison_wounded_desc');
                                    case 'hmerc':
                                        {
                                            let cost = Math.round((1.24 ** global.civic.garrison.workers) * 75) - 50;
                                            if (cost > 25000){
                                                cost = 25000;
                                            }
                                            if (global.civic.garrison.m_use > 0){
                                                cost *= 1.1 ** global.civic.garrison.m_use;
                                            }
                                            if (global.race['brute']){
                                                cost *= 1 - (traits.brute.vars[0] / 100);
                                            }
                                            cost = Math.round(cost).toLocaleString();
                                            return loc('civics_garrison_hire_mercenary_cost',[cost]);
                                        }
                                    case 'defenseRating':
                                        return loc('civics_garrison_defensive_rate');
                                    case 'offenseRating':
                                        return loc('civics_garrison_offensive_rate');
                                }
                            }
                        }
                    });
                },
                out: function(obj){
                    vBind({el: obj.id},'destroy');
                },
            }
        );
    });

    if (full){
        for (let i=0; i<3; i++){
            popover(`garrison${i}`,
                function(){
                    return battleAssessment(i);
                },
                {
                    elm: `#garrison .gov${i}`
                }
            );
        }
    }
}

export function describeSoldier(){
    let rating = armyRating(garrisonSize(),'hunting');
    let food = +(rating / 3).toFixed(2);
    let fur = +(rating / 10).toFixed(2);
    if (global.race['evil']){
        if (global.race['soul_eater']){
            let bones = +(armyRating(garrisonSize(),'hunting') / 3).toFixed(2);
            return global.race['kindling_kindred'] 
                ? loc('civics_garrison_evil_soldier_desc_boneless',[food,fur,global.resource.Food.name,global.resource.Furs.name])
                : loc('civics_garrison_evil_soldier_desc',[food,fur,bones,global.resource.Food.name,global.resource.Furs.name,global.resource.Lumber.name]);
        }
        else {
            let bones = +(armyRating(garrisonSize(),'hunting') / 5).toFixed(2);
            if (global.race['kindling_kindred']){
                return global.race['herbivore']
                    ? loc('civics_garrison_evil_alt_soldier_desc_flesh',[fur,global.resource.Furs.name])
                    : loc('civics_garrison_evil_alt_soldier_desc_herb',[food,fur,global.resource.Food.name,global.resource.Furs.name]);
                }
            else {
                return global.race['herbivore']
                    ? loc('civics_garrison_evil_alt_soldier_desc_herb',[fur,bones,global.resource.Furs.name,global.resource.Lumber.name])
                    : loc('civics_garrison_evil_alt_soldier_desc',[food,fur,bones,global.resource.Food.name,global.resource.Furs.name,global.resource.Lumber.name]);
            }
        }
    }
    else {
        return global.race['herbivore']
            ? loc('civics_garrison_soldier_desc_herb',[fur,global.resource.Furs.name])
            : loc('civics_garrison_soldier_desc',[food,fur,global.resource.Food.name,global.resource.Furs.name]);
    }
}

function battleAssessment(gov){
    if (global.civic.foreign[`gov${gov}`].occ){
        return loc('civics_garrison_deoccupy_desc');
    }
    else if (global.civic.foreign[`gov${gov}`].buy || global.civic.foreign[`gov${gov}`].anx){
        return loc('civics_garrison_secede_desc');
    }
    else if (
        (global.civic.garrison.tactic <= 1 && global.civic.foreign[`gov${gov}`].spy < 1) || 
        (global.civic.garrison.tactic >= 2 && global.civic.garrison.tactic <= 3 && global.civic.foreign[`gov${gov}`].spy < 2) || 
        (global.civic.garrison.tactic === 4 && global.civic.foreign[`gov${gov}`].spy < 3)
        ){
        return loc('civics_garrison_no_spy');
    }
    let army = armyRating(global.civic.garrison.raid,'army');
    let enemy = 0;
    switch(global.civic.garrison.tactic){
        case 0:
            enemy = 5;
            break;
        case 1:
            enemy = 27.5;
            break;
        case 2:
            enemy = 62.5;
            break;
        case 3:
            enemy = 125;
            break;
        case 4:
            enemy = 300;
            break;
    }
    enemy *= global.civic.foreign[`gov${gov}`].mil / 100;
    if (global.race['banana']){
        enemy *= 2;
    }

    if (eventActive('fool',2021)){
        enemy /= 1.25;
    }

    if (army < enemy){
        return loc('civics_garrison_disadvantage',[+((1 - (army / enemy)) * 100).toFixed(1)]);
    }
    else {
        return loc('civics_garrison_advantage',[+((1 - (enemy / army)) * 100).toFixed(1)]);
    }
}

function war_campaign(gov){
    if (global.civic.foreign[`gov${gov}`].occ){
        global.civic.foreign[`gov${gov}`].occ = false;
        global.civic.garrison.max += global.civic.govern.type === 'federation' ? 15 : 20;
        global.civic.garrison.workers += global.civic.govern.type === 'federation' ? 15 : 20;
        return;
    }
    if (global.civic.foreign[`gov${gov}`].buy || global.civic.foreign[`gov${gov}`].anx){
        global.civic.foreign[`gov${gov}`].buy = false;
        global.civic.foreign[`gov${gov}`].anx = false;
        return;
    }
    if (global.civic.garrison.raid === 0){
        messageQueue(loc('civics_garrison_campaign_no_soldier'),'warning');
        return;
    }
    global.stats.attacks++;

    if (global.civic.garrison.raid > garrisonSize()){
        global.civic.garrison.raid = garrisonSize();
    }
    else if (global.civic.garrison.raid < 0){
        global.civic.garrison.raid = 0;
    }

    let highLuck = global.race['claws'] ? 20 : 16;
    let lowLuck = global.race['puny'] ? 3 : 5;

    let luck = Math.floor(Math.seededRandom(lowLuck,highLuck),true) / 10;
    let army = armyRating(global.civic.garrison.raid,'army') * luck;
    let enemy = 0;                

    switch(global.civic.garrison.tactic){
        case 0:
            enemy = Math.seededRandom(0,10,true);
            global.civic.foreign[`gov${gov}`].hstl += Math.floor(Math.seededRandom(0,2,true));
            break;
        case 1:
            enemy = Math.seededRandom(5,50,true);
            global.civic.foreign[`gov${gov}`].hstl += Math.floor(Math.seededRandom(0,3,true));
            break;
        case 2:
            enemy = Math.seededRandom(25,100,true);
            global.civic.foreign[`gov${gov}`].hstl += Math.floor(Math.seededRandom(1,5,true));
            break;
        case 3:
            enemy = Math.seededRandom(50,200,true);
            global.civic.foreign[`gov${gov}`].hstl += Math.floor(Math.seededRandom(4,12,true));
            break;
        case 4:
            enemy = Math.seededRandom(100,500,true);
            global.civic.foreign[`gov${gov}`].hstl += Math.floor(Math.seededRandom(10,25,true));
            break;
    }
    enemy = Math.floor(enemy * global.civic.foreign[`gov${gov}`].mil / 100);
    if (global.race['banana']){
        enemy *= 2;
    }
    if (global.race['mistrustful']){
        global.civic.foreign[`gov${gov}`].hstl++;
    }
    if (global.civic.foreign[`gov${gov}`].hstl > 100){
        global.civic.foreign[`gov${gov}`].hstl = 100;
    }

    if (global.race['frenzy']){
        global.race['frenzy'] += Math.ceil(enemy / 5);
        if (global.race['frenzy'] > 1000000){
            global.race['frenzy'] = 1000000;
        }
    }

    let wounded = 0;
    if (global.civic.garrison.raid > global.civic.garrison.workers - global.civic.garrison.crew - global.civic.garrison.wounded){
        wounded = global.civic.garrison.raid - (global.civic.garrison.workers - global.civic.garrison.crew - global.civic.garrison.wounded);
    }

    global.civic.garrison.fatigue++;

    if (army > enemy){
        let deathCap = Math.floor(global.civic.garrison.raid / (5 - global.civic.garrison.tactic));
        deathCap += wounded;
        if (global.city.ptrait === 'rage'){
            deathCap += planetTraits.rage.vars[2];
        }
        if (deathCap < 1){
            deathCap = 1;
        }
        if (deathCap > looters()){
            deathCap = looters();
        }
        let death = Math.floor(Math.seededRandom(0,deathCap,true));
        if (global.race['frail']){
            death++;
        }
        let armor = 0;
        if (global.race['armored']){
            let armored = 1 - (traits.armored.vars[0] / 100);
            armor += Math.floor(death *armored);
        }
        if (global.race['scales']){
            armor += traits.scales.vars[0];
        }
        if (global.tech['armor']){
            armor += global.tech['armor'];
        }
        if (global.civic.garrison.raid > wounded){
            death -= armor;
        }

        if (death < 0){
            death = 0;
        }
        if (death > global.civic.garrison.raid){
            death = global.civic.garrison.raid;
        }
        global.civic.garrison.workers -= death;
        global.stats.died += death;
        global.civic.garrison.protest += death;
        if (death > wounded){
            global.civic.garrison.wounded -= wounded;
            wounded = 0;
        }
        else {
            global.civic.garrison.wounded -= death;
            wounded -= death;
        }

        global.civic.garrison.wounded += Math.floor(Math.seededRandom(wounded,global.civic.garrison.raid - death,true));

        let gains = {
            Money: 0,
            Food: 0,
            Lumber: 0,
            Stone: 0,
            Copper: 0,
            Iron: 0,
            Aluminium: 0,
            Coal: 0,
            Cement: 0,
            Steel: 0,
            Titanium: 0,
            Crystal: 0
        };

        let basic = ['Food','Lumber','Stone'];
        let common = ['Copper','Iron','Aluminium','Coal'];
        let rare = ['Cement','Steel'];
        if (global.tech['smoldering']){
            basic.push('Chrysotile');
        }
        if (global.race['terrifying']){
            rare.push('Titanium');
        }
        if (global.tech['magic']){
            rare.push('Crystal');
        }

        let looted = ['Money'];
        switch(global.civic.garrison.tactic){
            case 0:
                {
                    let extra = ['Money'].concat(basic,common);
                    looted.push(basic[Math.floor(Math.seededRandom(0,basic.length,true))]);
                    looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    if (global.race['beast_of_burden']){
                        looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    }
                    if (global.resource.Steel.amount < 25 && global.tech['smelting'] && global.tech.smelting === 1 && Math.floor(Math.seededRandom(0,20,true)) === 0){
                        looted.push('Steel');
                    }
                }
                break;
            case 1:
                {
                    let extra = ['Money'].concat(basic,common,rare);
                    looted.push(basic[Math.floor(Math.seededRandom(0,basic.length,true))]);
                    looted.push(common[Math.floor(Math.seededRandom(0,common.length,true))]);
                    looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    if (global.race['beast_of_burden']){
                        looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    }
                }
                break;
            case 2:
                {
                    let extra = ['Money'].concat(basic,common,rare);
                    let extraB = common.concat(rare);
                    looted.push(basic[Math.floor(Math.seededRandom(0,basic.length,true))]);
                    looted.push(common[Math.floor(Math.seededRandom(0,common.length,true))]);
                    looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    looted.push(extraB[Math.floor(Math.seededRandom(0,extraB.length,true))]);
                    if (global.race['beast_of_burden']){
                        looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    }
                }
                break;
            case 3:
                {
                    let extra = ['Money'].concat(basic,common,rare);
                    looted.push(basic[Math.floor(Math.seededRandom(0,basic.length,true))]);
                    looted.push(common[Math.floor(Math.seededRandom(0,common.length,true))]);
                    looted.push(rare[Math.floor(Math.seededRandom(0,rare.length,true))]);
                    looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    if (global.race['beast_of_burden']){
                        looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    }
                }
                break;
            case 4:
                {
                    let extra = ['Money'].concat(basic,common,rare);
                    looted.push(basic[Math.floor(Math.seededRandom(0,basic.length,true))]);
                    looted.push(common[Math.floor(Math.seededRandom(0,common.length,true))]);
                    looted.push(rare[Math.floor(Math.seededRandom(0,rare.length,true))]);
                    looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    if (global.race['beast_of_burden']){
                        looted.push(extra[Math.floor(Math.seededRandom(0,extra.length,true))]);
                    }
                }
                break;
        }

        looted.forEach(function(goods){
            switch (goods){
                case 'Money':
                    gains[goods] += Math.floor(Math.seededRandom(100,375,true));
                    break;
                case 'Food':
                    gains[goods] += Math.floor(Math.seededRandom(40,175,true));
                    break;
                case 'Lumber':
                case 'Stone':
                    gains[goods] += Math.floor(Math.seededRandom(50,250,true));
                    break;
                case 'Copper':
                case 'Iron':
                case 'Aluminium':
                    gains[goods] += Math.floor(Math.seededRandom(35,125,true));
                    break;
                case 'Coal':
                case 'Cement':
                    gains[goods] += Math.floor(Math.seededRandom(25,100,true));
                    break;
                case 'Steel':
                    gains[goods] += Math.floor(Math.seededRandom(20,65,true));
                    break;
                case 'Titanium':
                    gains[goods] += Math.floor(Math.seededRandom(12,32,true));
                    break;
                case 'Crystal':
                    gains[goods] += Math.floor(Math.seededRandom(1,5,true));
                    break;
            }
        });

        let loot = loc('civics_garrison_gained');
        if (global.resource.Money.display && gains.Money > 0){
            gains.Money = lootModify(gains.Money,gov);
            loot = loot + loc('civics_garrison_quant_money',[gains.Money]);
            modRes('Money',gains.Money);
        }

        let payout = basic.concat(common,rare);
        payout.forEach(function(res){
            if (gains[res] > 0 && (global.resource[res].display || res === 'Steel' || res === 'Titanium')){
                gains[res] = lootModify(gains[res],gov);
                loot = loot + loc('civics_garrison_quant_res',[gains[res],global.resource[res].name]);
                modRes(res,gains[res]);
                if (res === 'Steel' || res === 'Titanium'){
                    global.resource[res].display = true;
                }
            }
        });

        loot = loot.slice(0,-2);
        loot = loot + '.';
        messageQueue(loot,'warning');
        
        let revive = 0;
        if (global.race['revive']){
            switch (global.city.calendar.temp){
                case 0:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 5),true));
                    break;
                case 1:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 3),true));
                    break;
                case 2:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 1.5),true));
                    break;
            }
            global.civic.garrison.workers += revive;
        }
        if (revive > 0){
            messageQueue(loc('civics_garrison_victorious_revive',[death,revive]),'success');
        }
        else {
            messageQueue(loc('civics_garrison_victorious',[death]),'success');
        }


        if (global.race['slaver'] && global.city['slave_pen']){
            let max = global.city.slave_pen.count * 4;
            if (max > global.city.slave_pen.slaves){
                let slaves = Math.floor(Math.seededRandom(0,global.civic.garrison.tactic + 2,true));
                if (slaves + global.city.slave_pen.slaves > max){
                    slaves = max - global.city.slave_pen.slaves;
                }
                if (slaves > 0){
                    global.city.slave_pen.slaves += slaves;
                    global.resource.Slave.amount = global.city.slave_pen.slaves;
                    messageQueue(loc('civics_garrison_capture',[slaves]),'success');
                }
            }
        }
        if (global.race['infectious']){
            let infected = 0;
            switch(global.civic.garrison.tactic){
                case 0:
                    infected = Math.floor(Math.seededRandom(0,2,true));
                    break;
                case 1:
                    infected = Math.floor(Math.seededRandom(0,3,true));
                    break;
                case 2:
                    infected = Math.floor(Math.seededRandom(0,5,true));
                    break;
                case 3:
                    infected = Math.floor(Math.seededRandom(0,10,true));
                    break;
                case 4:
                    infected = Math.floor(Math.seededRandom(0,25,true));
                    break;
            }
            let zombies = global.resource[global.race.species].amount + infected;
            if (zombies > global.resource[global.race.species].max){
                infected = global.resource[global.race.species].max - global.resource[global.race.species].amount;
            }
            if (infected > 0){
                global.resource[global.race.species].amount += infected;
                if (global.civic.d_job !== 'unemployed'){
                    global.civic[global.civic.d_job].workers += infected;
                }
                if (infected === 1){
                    messageQueue(loc('civics_garrison_soldier_infected'),'special');
                }
                else {
                    messageQueue(loc('civics_garrison_soldiers_infected',[infected]),'special');
                }
            }
        }

        let occCost = global.civic.govern.type === 'federation' ? 15 : 20;
        if (global.civic.garrison.tactic === 4 && global.civic.garrison.workers >= occCost){
            let drawTechs = !global.tech['gov_fed'] && !checkControlling();
            global.civic.garrison.workers -= occCost;
            global.civic.foreign[`gov${gov}`].occ = true;
            global.civic.foreign[`gov${gov}`].sab = 0;
            global.civic.foreign[`gov${gov}`].act = 'none';
            if (drawTechs){
                drawTech();
            }
            if (global.race['banana']){
                let affix = universeAffix();
                global.stats.banana.b1[affix] = true;
                if (affix !== 'm' && affix !== 'l'){
                    global.stats.banana.b1.l = true;
                }
            }
        }
    }
    else {
        let deathCap = global.civic.garrison.raid;
        deathCap += wounded;
        if (global.civic.garrison.tactic === 0){
            deathCap = Math.floor(deathCap / 2);
        }
        if (global.city.ptrait === 'rage'){
            deathCap += planetTraits.rage.vars[2];
        }
        if (deathCap < 1){
            deathCap = 1;
        }
        if (deathCap > looters()){
            deathCap = looters();
        }
        let death = Math.floor(Math.seededRandom(1,deathCap,true));
        if (global.race['frail']){
            death += global.civic.garrison.tactic + 1;
        }
        let armor = 0;
        if (global.race['armored']){
            let armored = 1 - (traits.armored.vars[0] / 100);
            armor += Math.floor(death * armored);
        }
        if (global.race['scales']){
            armor += traits.scales.vars[1];
        }
        if (global.tech['armor']){
            armor += global.tech['armor'];
        }
        if (global.civic.garrison.raid > wounded){
            death -= armor;
        }

        if (death < 1){
            death = 1;
        }
        if (death > global.civic.garrison.raid){
            death = global.civic.garrison.raid;
        }
        global.civic.garrison.workers -= death;
        global.stats.died += death;
        global.civic.garrison.protest += death;
        if (death > wounded){
            global.civic.garrison.wounded -= wounded;
            wounded = 0;
        }
        else {
            global.civic.garrison.wounded -= death;
            wounded -= death;
        }
        global.civic.garrison.wounded += 1 + Math.floor(Math.seededRandom(wounded,global.civic.garrison.raid - death,true));

        let revive = 0;
        if (global.race['revive']){
            switch (global.city.calendar.temp){
                case 0:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 6),true));
                    break;
                case 1:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 4),true));
                    break;
                case 2:
                    revive = Math.floor(Math.seededRandom(0,Math.floor(death / 2),true));
                    break;
            }
            global.civic.garrison.workers += revive;
        }
        if (revive > 0){
            messageQueue(loc('civics_garrison_defeat_revive',[death,revive]),'danger');
        }
        else {
            messageQueue(loc('civics_garrison_defeat',[death]),'danger');
        }
    }
    if (global.civic.garrison.wounded > global.civic.garrison.workers - global.civic.garrison.crew){
        global.civic.garrison.wounded = global.civic.garrison.workers - global.civic.garrison.crew;
    }
    else if (global.civic.garrison.wounded < 0){
        global.civic.garrison.wounded = 0;
    }
}

function looters(){
    let cap = 0;
    let looting = global.civic.garrison.raid;
    switch(global.civic.garrison.tactic){
        case 0:
            cap = 5;
            break;
        case 1:
            cap = 10;
            break;
        case 2:
            cap = 25;
            break;
        case 3:
            cap = 50;
            break;
        case 4:
            cap = 999;
            break;
    }
    if (looting > cap){
        looting = cap;
    }
    return looting;
}

function lootModify(val,gov){
    let looting = looters();
    let loot = val * Math.log(looting + 1);
    if (global.race['invertebrate']){
        loot *= 1 - (traits.invertebrate.vars[0] / 100);
    }
    if (global.race.universe === 'evil'){
        loot *= darkEffect('evil');
    }

    switch(global.civic.garrison.tactic){
        case 1:
            loot *= 4;
            break;
        case 2:
            loot *= 30;
            break;
        case 3:
            loot *= 100;
            break;
        case 4:
            loot *= 400;
            break;
    }

    if (global.race['banana']){
        loot *= 0.5;
    }

    return Math.floor(loot * global.civic.foreign[`gov${gov}`].eco / 100);
}

export function armyRating(val,type,wound){
    if (!global.civic.hasOwnProperty('garrison')){
        return 1;
    }

    let wounded = 0;
    if (wound){
        wounded = wound;
    }
    else if (val > global.civic.garrison.workers - global.civic.garrison.wounded){
        wounded = val - (global.civic.garrison.workers - global.civic.garrison.wounded);
    }

    let weapon_tech = global.tech['military'] && global.tech.military >= 5 ? global.tech.military - 1 : global.tech.military;
    let army = global.tech['military'] ? (val - (wounded / 2)) * weapon_tech : (val - (wounded / 2));
    if (type === 'army' || type === 'hellArmy'){
        if (global.race['puny']){
            army *= 1 - (traits.puny.vars[0] / 100);
        }
        if (global.race['claws']){
            army *= 1 + (traits.claws.vars[0] / 100);
        }
        if (global.race['chameleon']){
            army *= 1 + (traits.chameleon.vars[0] / 100);
        }
        if (global.race['cautious'] && global.city.calendar.weather === 0){
            army *= 1 - (traits.cautious.vars[0] / 100);
        }
        if (global.race['apex_predator']){
            army *= 1 + (traits.apex_predator.vars[0] / 100);
        }
        if (global.race['fiery']){
            army *= 1 + (traits.fiery.vars[0] / 100);
        }
        if (global.race['sticky']){
            army *= 1 + (traits.sticky.vars[1] / 100);
        }
        if (global.race['pathetic']){
            army *= 1 - (traits.pathetic.vars[0] / 100);
        }
        if (global.race['tactical']){
            army *= 1 + (traits.tactical.vars[0] * global.race['tactical'] / 100);
        }
        if (global.tech['fanaticism'] && global.tech['fanaticism'] >= 4){
            army *= 1 + (global.city.temple.count * 0.01);
        }
        if (global.race['holy'] && type === 'hellArmy'){
            army *= 1 + (traits.holy.vars[0] / 100);
        }
        if (global.race['banana'] && type === 'hellArmy'){
            army *= 0.8;
        }
        if (global.city.ptrait === 'rage'){
            army *= planetTraits.rage.vars[0];
        }
        if (global.race['parasite']){
            if (val === 1){
                army += 2;
            }
            else if (val > 1){
                army += 4;
            }
        }
    }
    else if (type === 'hunting'){
        if (global.race['tracker']){
            army *= 1 + (traits.tracker.vars[0] / 100);
        }
        if (global.race['beast']){
            let rate = global.city.calendar.wind === 1 ? traits.beast.vars[1] : traits.beast.vars[0];
            army *= 1 + (rate / 100);
        }
        if (global.race['apex_predator']){
            army *= 1 + (traits.apex_predator.vars[1] / 100);
        }
        if (global.race['fiery']){
            army *= 1 + (traits.fiery.vars[1] / 100);
        }
        if (global.race['fragrant']){
            army *= 1 - (traits.fragrant.vars[0] / 100);
        }
        if (global.city.ptrait === 'rage'){
            army *= planetTraits.rage.vars[1];
        }
        if (global.race['cunning']){
            army *= 1 + (traits.cunning.vars[0] * global.race['cunning'] / 100);
        }
    }
    if (global.civic.govern.type === 'autocracy'){
        army *= 1.35;
    }
    army = Math.floor(army);
    return army * racialTrait(val,type);
}

export function garrisonSize(max){
    let type = max ? 'max' : 'workers';
    if (global.portal['fortress']){
        return global.civic.garrison[type] - global.civic.garrison.crew - global.portal.fortress.garrison;
    }
    return global.civic.garrison[type] - global.civic.garrison.crew;
}

function defineMad(){
    if ($(`#mad`).length === 0){
        let plasmidType = global.race.universe === 'antimatter' ? loc('resource_AntiPlasmid_plural_name') : loc('resource_Plasmid_plural_name');
        var mad_command = $('<div id="mad" v-show="display" class="tile is-child"></div>');
        $('#military').append(mad_command);
        var mad = $('<div class="mad"></div>');
        mad_command.append(mad);

        mad.append($(`<div class="warn">${loc('civics_mad_reset_desc',[plasmidType])}</div>`));

        mad.append($(`<div class="defcon mdarm"><button class="button arm" @click="arm">${loc('civics_mad_arm_missiles')}</button></div>`));
        mad.append($(`<div class="defcon mdlaunch"><button class="button" @click="launch" :disabled="armed">${loc('civics_mad_launch_missiles')}</button></div>`));

        if (!global.civic.mad.armed){
            $('#mad').addClass('armed');
            $('#mad .arm').html(loc('civics_mad_disarm_missiles'));
        }

        vBind({
            el: '#mad',
            data: global.civic['mad'],
            methods: {
                launch(){
                    if (!global.civic.mad.armed && !global.race['cataclysm']){
                        $('body').addClass('nuke');
                        let nuke = $('<div class="nuke"></div>');
                        $('body').append(nuke);
                        setTimeout(function(){
                            nuke.addClass('burn');
                        }, 500);
                        setTimeout(function(){
                            nuke.addClass('b');
                        }, 600);
                        setTimeout(function(){
                            warhead();
                        }, 4000);
                    }
                },
                arm(){
                    if (global.civic.mad.armed){
                        $('#mad .arm').html(loc('civics_mad_disarm_missiles'));
                        global.civic.mad.armed = false;
                        $('#mad').addClass('armed');
                    }
                    else {
                        $('#mad .arm').html(loc('civics_mad_arm_missiles'));
                        global.civic.mad.armed = true;
                        $('#mad').removeClass('armed');
                    }
                }
            }
        });

        ['mdarm','mdlaunch'].forEach(function(k){
            popover(`mad${k}`,
                function(){ return '<span>{{ label() }}</span>'; },
                {
                    elm: `#mad .${k}`,
                    in: function(obj){
                        vBind({
                            el: `#${obj.id} > span`,
                            data: { test: 'val' },
                            methods: {
                                label(){
                                    switch(k){
                                        case 'mdarm':
                                            return global.tech['world_control']
                                                ? loc('civics_mad_missiles_world_control_desc')
                                                : loc('civics_mad_missiles_desc');
                                        case 'mdlaunch':
                                            {
                                                let gains = calcPrestige('mad');
                                                let plasmidType = global.race.universe === 'antimatter' ? loc('resource_AntiPlasmid_plural_name') : loc('resource_Plasmid_plural_name');
                                                return loc('civics_mad_missiles_warning',[gains.plasmid,plasmidType]);
                                            }
                                    }
                                }
                            }
                        });
                    },
                    out: function(obj){
                        vBind({el: `#${obj.id} > span`},'destroy');
                    },
                }
            );
        });
    }
}

function warhead(){
    if (!global.civic.mad.armed && !global.race['cataclysm']){
        save.setItem('evolveBak',LZString.compressToUTF16(JSON.stringify(global)));
        global.lastMsg = false;

        tagEvent('reset',{
            'end': 'mad'
        });

        let god = global.race.species;
        let old_god = global.race.gods;
        let orbit = global.city.calendar.orbit;
        let biome = global.city.biome;
        let atmo = global.city.ptrait;
        let geo = global.city.geology;
        let plasmid = global.race.Plasmid.count;
        let antiplasmid = global.race.Plasmid.anti;

        let gains = calcPrestige('mad');
        let new_plasmid = gains.plasmid;

        global.stats.reset++;
        global.stats.mad++;
        global.stats.tdays += global.stats.days;
        global.stats.days = 0;
        global.stats.tknow += global.stats.know;
        global.stats.know = 0;
        global.stats.tstarved += global.stats.starved;
        global.stats.starved = 0;
        global.stats.tdied += global.stats.died;
        global.stats.died = 0;
        if (global.race.universe === 'antimatter'){
            antiplasmid += new_plasmid;
            global.stats.antiplasmid += new_plasmid;
        }
        else {
            plasmid += new_plasmid;
            global.stats.plasmid += new_plasmid;
        }
        unlockAchieve(`apocalypse`);
        unlockAchieve(`squished`,true);
        unlockAchieve(`extinct_${god}`);
        if (global.civic.govern.type === 'anarchy'){
            unlockAchieve(`anarchist`);
        }
        if (global.city.biome === 'hellscape' && races[global.race.species].type !== 'demonic'){
            unlockFeat('take_no_advice');
        }
        checkAchievements();
        let corruption = global.race.hasOwnProperty('corruption') && global.race.corruption > 1 ? global.race.corruption - 1 : 0;
        global['race'] = { 
            species : 'protoplasm', 
            gods: god,
            old_gods: old_god,
            rapid_mutation: 1,
            ancient_ruins: 1,
            Plasmid: { count: plasmid, anti: antiplasmid },
            Phage: { count: global.race.Phage.count },
            Dark: { count: global.race.Dark.count },
            Harmony: { count: global.race.Harmony.count },
            universe: global.race.universe,
            seeded: false,
            ascended: global.race.hasOwnProperty('ascended') ? global.race.ascended : false,
        };
        if (corruption > 0){
            global.race['corruption'] = corruption;
        }
        global.city = {
            calendar: {
                day: 0,
                year: 0,
                weather: 2,
                temp: 1,
                moon: 0,
                wind: 0,
                orbit: orbit
            },
            biome: biome,
            ptrait: atmo,
            geology: geo
        };
        global.tech = { theology: 1 };
        clearStates();
        global.new = true;
        Math.seed = Math.rand(0,10000);
        global.seed = Math.seed;
        
        save.setItem('evolved',LZString.compressToUTF16(JSON.stringify(global)));
        window.location.reload();
    }
}
