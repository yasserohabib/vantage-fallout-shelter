export enum Gender{
    female = 1,
    male = 2
}
export interface Dweller {
    firstName : string;
    lastName : number;
    gender : number;
    health : number;
    maxHealth : number;
    radiation : number;    
    level : number;    
    maxStats : boolean;
}