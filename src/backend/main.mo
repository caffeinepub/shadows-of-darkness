import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import List "mo:core/List";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Timer "mo:core/Timer";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type CustomSound = {
    summon_sound : ?Storage.ExternalBlob;
    attack_sound : ?Storage.ExternalBlob;
    effect_sound : ?Storage.ExternalBlob;
    victory_sound : ?Storage.ExternalBlob;
    defeat_sound : ?Storage.ExternalBlob;
  };

  public type UserProfile = {
    username : Text;
    xp : Nat;
    level : Nat;
    wins : Nat;
    losses : Nat;
    pack_count : Nat;
    profile_picture : ?Storage.ExternalBlob;
    wallpaper : Text;
    difficulty : Text;
    sound_assignments : Map.Map<Text, CustomSound>;
  };

  public type UserProfileView = {
    username : Text;
    xp : Nat;
    level : Nat;
    wins : Nat;
    losses : Nat;
    pack_count : Nat;
    profile_picture : ?Storage.ExternalBlob;
    wallpaper : Text;
    difficulty : Text;
  };

  public type CardType = {
    #monster : {
      effect : Bool;
      fusion : Bool;
      synchro : Bool;
      xyz : Bool;
      link : Bool;
      ritual : Bool;
    };
    #spell;
    #trap;
  };

  public type Attribute = {
    #dark;
    #light;
    #fire;
    #water;
    #earth;
    #wind;
    #divine;
  };

  public type Card = {
    id : Nat;
    name : Text;
    card_type : CardType;
    monster_type : ?Text;
    attribute : ?Attribute;
    atk : ?Nat;
    def : ?Nat;
    level_rank : ?Nat;
    effect_text : ?Text;
    rarity : Nat;
    is_custom : Bool;
    owner : ?Principal;
    art_blob : ?Storage.ExternalBlob;
    summon_sound : ?Storage.ExternalBlob;
    attack_sound : ?Storage.ExternalBlob;
    effect_sound : ?Storage.ExternalBlob;
  };

  public type Deck = {
    name : Text;
    main_deck : [Nat];
    extra_deck : [Nat];
    is_active : Bool;
  };

  public type PackType = {
    #shadows_core;
    #dark_legends;
    #forbidden_relics;
  };

  public type DuelAction = {
    action_type : Text;
    details : Text;
  };

  public type DuelState = {
    player1 : Principal;
    player2 : ?Principal;
    lp1 : Nat;
    lp2 : Nat;
    turn : Nat;
    phase : Text;
    actions : List.List<DuelAction>;
    is_active : Bool;
  };

  public type DuelStateView = {
    player1 : Principal;
    player2 : ?Principal;
    lp1 : Nat;
    lp2 : Nat;
    turn : Nat;
    phase : Text;
    is_active : Bool;
  };

  public type DuelHistory = {
    player1 : Principal;
    player2 : Principal;
    winner : Principal;
    actions : [DuelAction];
    timestamp : Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let cards = Map.empty<Nat, Card>();
  let userCards = Map.empty<Principal, Map.Map<Nat, Nat>>();
  let decks = Map.empty<Principal, Map.Map<Text, Deck>>();
  let duels = Map.empty<Principal, DuelState>();
  let duelHistory = Map.empty<Principal, List.List<DuelHistory>>();
  let customCards = Map.empty<Principal, List.List<Card>>();
  var nextCardId = 150;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        ?{
          username = profile.username;
          xp = profile.xp;
          level = profile.level;
          wins = profile.wins;
          losses = profile.losses;
          pack_count = profile.pack_count;
          profile_picture = profile.profile_picture;
          wallpaper = profile.wallpaper;
          difficulty = profile.difficulty;
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileView {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        ?{
          username = profile.username;
          xp = profile.xp;
          level = profile.level;
          wins = profile.wins;
          losses = profile.losses;
          pack_count = profile.pack_count;
          profile_picture = profile.profile_picture;
          wallpaper = profile.wallpaper;
          difficulty = profile.difficulty;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(username : Text, difficulty : Text) : async ?UserProfileView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let current_profile = switch (userProfiles.get(caller)) {
      case (null) { emptyUserProfile(username, difficulty) };
      case (?profile) { profile };
    };

    let updated_profile : UserProfile = {
      username;
      difficulty;
      xp = current_profile.xp;
      level = current_profile.level;
      wins = current_profile.wins;
      losses = current_profile.losses;
      pack_count = current_profile.pack_count;
      profile_picture = current_profile.profile_picture;
      wallpaper = current_profile.wallpaper;
      sound_assignments = updateSoundAssignments(current_profile.sound_assignments, difficulty);
    };

    userProfiles.add(caller, updated_profile);
    ?{
      username = updated_profile.username;
      xp = updated_profile.xp;
      level = updated_profile.level;
      wins = updated_profile.wins;
      losses = updated_profile.losses;
      pack_count = updated_profile.pack_count;
      profile_picture = updated_profile.profile_picture;
      wallpaper = updated_profile.wallpaper;
      difficulty = updated_profile.difficulty;
    };
  };

  public shared ({ caller }) func addUserCard(card_id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cards");
    };

    let user_map = switch (userCards.get(caller)) {
      case (null) { Map.empty<Nat, Nat>() };
      case (?user_map) { user_map };
    };
    user_map.add(card_id, 1);
    userCards.add(caller, user_map);
  };

  public shared ({ caller }) func createDeck(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create decks");
    };

    let deck : Deck = {
      name;
      main_deck = [];
      extra_deck = [];
      is_active = false;
    };

    let existing_decks = switch (decks.get(caller)) {
      case (null) { Map.empty<Text, Deck>() };
      case (?deck_map) { deck_map };
    };
    existing_decks.add(name, deck);
    decks.add(caller, existing_decks);
  };

  public shared ({ caller }) func initDuel(player2 : ?Principal) : async {
    player1 : Principal;
    duel_id : ?Principal;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate duels");
    };

    switch (player2) {
      case (null) {
        duels.add(
          caller,
          {
            player1 = caller;
            player2 = null;
            lp1 = 8000;
            lp2 = 8000;
            turn = 1;
            phase = "draw";
            actions = List.empty<DuelAction>();
            is_active = true;
          },
        );
        {
          player1 = caller;
          duel_id = null;
        };
      };
      case (?opponent) {
        duels.add(
          opponent,
          {
            player1 = caller;
            player2 = player2;
            lp1 = 8000;
            lp2 = 8000;
            turn = 1;
            phase = "draw";
            actions = List.empty<DuelAction>();
            is_active = true;
          },
        );
        {
          player1 = opponent;
          duel_id = player2;
        };
      };
    };
  };

  public shared ({ caller }) func takeTurn(actions : [DuelAction]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can take turns");
    };

    switch (duels.get(caller)) {
      case (null) { Runtime.trap("Duel not found") };
      case (?duel) {
        // Verify caller is a participant in the duel
        let isParticipant = duel.player1 == caller or (switch (duel.player2) {
          case (null) { false };
          case (?p2) { p2 == caller };
        });

        if (not isParticipant) {
          Runtime.trap("Unauthorized: You are not a participant in this duel");
        };

        let new_actions = List.empty<DuelAction>();
        for (action in actions.values()) {
          new_actions.add(action);
        };

        let updated_duel = {
          duel with
          player1 = duel.player1;
          player2 = duel.player2;
          lp1 = duel.lp1;
          lp2 = duel.lp2;
          turn = duel.turn;
          phase = duel.phase;
          actions = new_actions;
          is_active = duel.is_active;
        };

        duels.add(caller, updated_duel);
      };
    };
  };

  public query ({ caller }) func getCompletedDuelHistory() : async [DuelHistory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view duel history");
    };

    switch (duelHistory.get(caller)) {
      case (null) { [] };
      case (?history) {
        let completed = history.filter(
          func(duel) { duel.player2 != duel.winner },
        );
        completed.toArray();
      };
    };
  };

  public shared ({ caller }) func createCustomCard(
    cardType : CardType,
    attribute : ?Attribute,
    rarity : Nat,
    art_blob : ?Storage.ExternalBlob,
    summon_sound : ?Storage.ExternalBlob,
    attack_sound : ?Storage.ExternalBlob,
    effect_sound : ?Storage.ExternalBlob,
  ) : async Card {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create custom cards");
    };

    let new_card : Card = {
      id = nextCardId;
      name = "";
      card_type = cardType;
      monster_type = null;
      attribute;
      atk = null;
      def = null;
      level_rank = null;
      effect_text = null;
      rarity;
      is_custom = true;
      owner = ?caller;
      art_blob;
      summon_sound;
      attack_sound;
      effect_sound;
    };
    nextCardId += 1;
    cards.add(new_card.id, new_card);
    new_card;
  };

  func emptyUserProfile(username : Text, difficulty : Text) : UserProfile {
    {
      username;
      difficulty;
      xp = 0;
      level = 1;
      wins = 0;
      losses = 0;
      pack_count = 0;
      profile_picture = null;
      wallpaper = "";
      sound_assignments = Map.empty<Text, CustomSound>();
    };
  };

  func updateSoundAssignments(sound_assignments : Map.Map<Text, CustomSound>, difficulty : Text) : Map.Map<Text, CustomSound> {
    let new_map = Map.empty<Text, CustomSound>();
    new_map.add(difficulty, {
      summon_sound = null;
      attack_sound = null;
      effect_sound = null;
      victory_sound = null;
      defeat_sound = null;
    });
    new_map;
  };

  // Public query - accessible to all users including guests
  public query ({ caller }) func getAllCards() : async [Card] {
    cards.values().toArray();
  };

  public query ({ caller }) func getAllDuelHistory(caller_principal : Principal) : async [DuelHistory] {
    // Only allow viewing own history or admin can view any
    if (caller != caller_principal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own duel history");
    };

    switch (duelHistory.get(caller_principal)) {
      case (null) { [] };
      case (?history) { history.toArray() };
    };
  };

  public query ({ caller }) func getCustomSounds() : async [CustomSound] {
    // Public query - accessible to all
    [];
  };
};
