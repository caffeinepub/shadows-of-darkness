import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Card {
    id: bigint;
    atk?: bigint;
    def?: bigint;
    monster_type?: string;
    owner?: Principal;
    summon_sound?: ExternalBlob;
    name: string;
    level_rank?: bigint;
    attack_sound?: ExternalBlob;
    art_blob?: ExternalBlob;
    effect_text?: string;
    effect_sound?: ExternalBlob;
    rarity: bigint;
    card_type: CardType;
    is_custom: boolean;
    attribute?: Attribute;
}
export interface CustomSound {
    victory_sound?: ExternalBlob;
    summon_sound?: ExternalBlob;
    attack_sound?: ExternalBlob;
    defeat_sound?: ExternalBlob;
    effect_sound?: ExternalBlob;
}
export type CardType = {
    __kind__: "trap";
    trap: null;
} | {
    __kind__: "spell";
    spell: null;
} | {
    __kind__: "monster";
    monster: {
        xyz: boolean;
        link: boolean;
        ritual: boolean;
        effect: boolean;
        fusion: boolean;
        synchro: boolean;
    };
};
export interface UserProfileView {
    xp: bigint;
    username: string;
    wallpaper: string;
    profile_picture?: ExternalBlob;
    difficulty: string;
    wins: bigint;
    losses: bigint;
    level: bigint;
    pack_count: bigint;
}
export interface DuelAction {
    action_type: string;
    details: string;
}
export interface DuelHistory {
    winner: Principal;
    actions: Array<DuelAction>;
    player1: Principal;
    player2: Principal;
    timestamp: bigint;
}
export enum Attribute {
    dark = "dark",
    fire = "fire",
    wind = "wind",
    earth = "earth",
    light = "light",
    divine = "divine",
    water = "water"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addUserCard(card_id: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomCard(cardType: CardType, attribute: Attribute | null, rarity: bigint, art_blob: ExternalBlob | null, summon_sound: ExternalBlob | null, attack_sound: ExternalBlob | null, effect_sound: ExternalBlob | null): Promise<Card>;
    createDeck(name: string): Promise<void>;
    getAllCards(): Promise<Array<Card>>;
    getAllDuelHistory(caller_principal: Principal): Promise<Array<DuelHistory>>;
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletedDuelHistory(): Promise<Array<DuelHistory>>;
    getCustomSounds(): Promise<Array<CustomSound>>;
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    initDuel(player2: Principal | null): Promise<{
        duel_id?: Principal;
        player1: Principal;
    }>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(username: string, difficulty: string): Promise<UserProfileView | null>;
    takeTurn(actions: Array<DuelAction>): Promise<void>;
}
