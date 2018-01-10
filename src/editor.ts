import * as CryptoJS  from 'crypto-js';
import { Dweller } from './dweller';
import { observable, computedFrom } from 'aurelia-framework';
import rooms from './rooms';
import recipes from './recipes';
import {Tree, TreeNode, TreeComponent} from 'libvantage';

const aesIV = CryptoJS.enc.Hex.parse('7475383967656A693334307438397532');
const aesKey = CryptoJS.enc.Hex.parse("A7CA9F3366D892C2F0BEF417341CA971B69AE9F7BACCCFFCF43C62D1D7D021F9");

export type DwellerMap = {
    [serializedId: number]: any;
};

export class Editor {
    private buffer: Buffer;
    public saveDataJson : any;

    public dwellers : DwellerMap[];

    public dwellerNodes: TreeNode[];
    public dwellerTree : Tree;

    public vault : any;
    public vaultNodes : TreeNode[];
    public vaultTree : Tree;

    public load(buffer: Buffer) : void {
        this.buffer = buffer;

        this.dwellerNodes = []
        this.vaultNodes = [];

        var decData = this.aesCbcDecrypt(this.buffer);
        this.saveDataJson = JSON.parse(decData);
        this.vault = this.saveDataJson.vault;
        this.dwellers = [];

        const dwellers = this.saveDataJson.dwellers.dwellers;

        dwellers.forEach(dweller => {

            const fullName = `${dweller.name} ${dweller.lastName}`;       
            this.dwellerNodes.push({
                    name : fullName,
                    id : dweller.serializeId,
                    nodes : [
                        this.createTextStatNode('name', 'First Name', dweller),                      
                        this.createTextStatNode('lastName', 'Last Name', dweller),                    
                        this.createStatNode('happinessValue', 'Happiness', dweller.happiness),
                        this.createStatNode('healthValue', 'Health', dweller.health),
                        this.createStatNode('maxHealth', 'Max Health', dweller.health),
                        this.createStatNode('radiationValue', 'Radiation', dweller.health),
                        this.createStatNode('currentLevel', 'Level', dweller.experience),
                        this.createTextColorNode('skinColor', 'Skin Color', dweller),
                        this.createTextColorNode('hairColor', 'Hair Color', dweller),
                        this.createTextColorNode('outfitColor', 'Outfit Color', dweller),
                        {
                            id : "special",
                            name : "S.P.E.C.I.A.L",
                            component : {
                                type : 'button',
                                label : "Max",
                                callback : () => this.maxAllStats(dweller),
                            },
                            nodes : [
                                this.createStatNode('value', 'S', dweller.stats.stats[1]),
                                this.createStatNode('value', 'P', dweller.stats.stats[2]),
                                this.createStatNode('value', 'E', dweller.stats.stats[3]),  
                                this.createStatNode('value', 'C', dweller.stats.stats[4]),  
                                this.createStatNode('value', 'I', dweller.stats.stats[5]),       
                                this.createStatNode('value', 'A', dweller.stats.stats[6]),  
                                this.createStatNode('value', 'L', dweller.stats.stats[7]),                                                                                                                                                                                         
                            ]
                        }
                    ],
                });
                
                this.dwellers[dweller.serializeId] = dweller;
            });

        this.vaultNodes.push(    
            {
                name : 'Vault ' + this.vault.VaultName,
                id : this.vault.VaultName,
                nodes : [
                    this.createTextStatNode('VaultName', 'Vault Name', this.vault),
                    this.createStatNode('Nuka', 'Caps', this.vault.storage.resources),
                    this.createStatNode('NukaColaQuantum', 'Nuka Cola Quantum', this.vault.storage.resources),
                    this.createStatNode('Food', 'Food', this.vault.storage.resources),
                    this.createStatNode('Energy', 'Energy', this.vault.storage.resources),
                    this.createStatNode('Water', 'Water', this.vault.storage.resources),                    
                    this.createStatNode('Lunchbox', 'Lunch Boxes', this.vault.storage.resources),
                    this.createStatNode('MrHandy', 'Mr. Handles', this.vault.storage.resources),
                    this.createStatNode('PetCarrier', 'Pet Carrier', this.vault.storage.resources),
                    this.createStatNode('RadAway', 'RadAway', this.vault.storage.resources),
                    this.createStatNode('StimPack', 'Stimpack', this.vault.storage.resources),
                ]
            }
        );
    }

    public save(): Buffer {
        // create new array of the modified dwellers
        let newDwellers = [];
        for (let dweller in this.dwellers){
            newDwellers.push(this.dwellers[dweller]);
        }
        // write dweller array back to save data
        this.saveDataJson.dwellers.dwellers = newDwellers;
        // set vault data
        this.saveDataJson.vault = this.vault;
        const stringData = JSON.stringify(this.saveDataJson);
        // encryptr buffer and write
        const buffer = this.aesCbcEncrypt(stringData);     
        return buffer;
    }

    public unlockAllRooms() : void {
        this.saveDataJson.unlockableMgr.objectivesInProgress = [];
        this.saveDataJson.unlockableMgr.completed = [];                
        this.saveDataJson.unlockableMgr.claimed = rooms;
    }

    public unlockAllRecipes() : void {
        this.saveDataJson.survivalW.recipes = recipes;
    }

    public unlockAllThemes() : void {
        for(let room in this.saveDataJson.survivalW.collectedThemes.themeList){
            this.saveDataJson.survivalW.collectedThemes.themeList[room].extraData.partsCollectedCount = 9;
            this.saveDataJson.survivalW.collectedThemes.themeList[room].extraData.IsNew  = true;            
        }
    }

    public removeAllRocks() : void {
        this.saveDataJson.vault.rocks = [];
    }

    public clearRoomEmergencies() : void {
        for(let room in this.saveDataJson.vault.rooms){
            this.saveDataJson.vault.rooms[room].currentStateName = 'Idle';
        }
    }     
    public healDwellers() : void {
        for (let dweller in this.dwellers){
            let dwObj = <any>this.dwellers[dweller];
            dwObj.health.radiationValue = 0;
            dwObj.health.healthValue = dwObj.health.maxHealth;
        }
    }

    public maxDwellerHappiness() : void {
        for (let dweller in this.dwellers){
            let dwObj = <any>this.dwellers[dweller];
            dwObj.happiness.happinessValue = 100;
        }
    }

    public maxAllDwellerStats() : void {
        for (let dweller in this.dwellers){
            let dwObj = <any>this.dwellers[dweller];
            for(let i = 1; i < 8; i++) {
                    dwObj.stats.stats[i].value = 10;
            }
        }
    }
    public maxAllStats(dweller : any) : void {
        for(let i = 1; i < 8; i++) {
            dweller.stats.stats[i].value = 10;
        }
    }

    public clearWaitingDwellers() : void {
        this.saveDataJson.dwellerSpawner.dwellersWaiting = [];
    }
      
    public aesCbcDecrypt(data: Buffer): string {

        var decrypted = CryptoJS.AES.decrypt( data.toString(), aesKey, {
            keySize: 128 / 8,
            iv: aesIV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        var plain = decrypted.toString(CryptoJS.enc.Utf8);
        return plain;
    }

    public aesCbcEncrypt(data: string): Buffer {
        var encrypted = CryptoJS.AES.encrypt(data, aesKey,
            {
                keySize: 128 / 8,
                iv: aesIV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
        var encData = encrypted.toString();
        return Buffer.from(encData);
    } 
    public createStatNode( id : string, name : string, object : any ) : any {
        return {
            id: id,
            name: name,
            component : new PlayerStatComponent(object, id),
        }
    }   
    public createTextStatNode( id : string, name : string, object : any ) : any {
        return {
            id: id,
            name: name,
            component : new PlayerTextStatComponent(object, id),
        }
    } 
    public createTextColorNode( id : string, name : string, object : any ) : any {
        return {
            id: id,
            name: name,
            component : new PlayerColorComponent(object, id),
        }
    }        
}
export class PlayerColorComponent implements TreeComponent {
    public type : "text";
    public statObject : any;
    public statId : any;
    
    constructor(stat : any, id: string) {
        this.type = 'text';
        this.statObject = stat;
        this.statId = id;
    }

    private numberToHex(value: number): string {
        return '#' + value.toString(16).substring(2).toUpperCase();
    }
    private hexToNumber(value: string ): number {
        value = `FF${value.replace('#', '')}`;        
        return parseInt(value, 16);
    }

    @computedFrom('statObject[statId]')
    public get value(): string {
        return this.numberToHex(this.statObject[this.statId]);
    }
    public set value(color: string) {
        this.statObject[this.statId] = this.hexToNumber(color);
    }
}
export class PlayerStatComponent implements TreeComponent {
    public type : "number";
    public statObject : any;
    public statId : string;
    public step : number;
    public min : number;
    public max : number;

    constructor(stat : any, id: string, max? : number) {
        this.statObject = stat;
        this.statId = id;
        this.type = 'number';
        this.min = 0;
        this.step = 1;
        this.max = max || 999999;
    }

    @computedFrom('statObject[statId]')
    public get value(): number {
        return this.statObject[this.statId];
    }

    public set value(value: number) {
        this.statObject[this.statId] = value;
    }
}
export class PlayerTextStatComponent implements TreeComponent {
    public type : "text";
    public statObject : any;
    public statId : string;

    constructor(stat : any, id: string, max? : number) {
        this.statObject = stat;
        this.statId = id;
        this.type = 'text';
    }

    @computedFrom('statObject[statId]')
    public get value(): string {
        return this.statObject[this.statId];
    }

    public set value(value: string) {
        this.statObject[this.statId] = value;
    }
}
