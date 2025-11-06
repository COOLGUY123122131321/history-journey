import { Journey, Resources } from './types';

export const JOURNEYS: Journey[] = [
    {
        id: "french-revolution",
        name: "French Revolution: A Farmer's Tale",
        description: "Will you fight for liberty or survive the chaos?",
        cardImage: 'https://storage.googleapis.com/aistudio-v2-a-prod-0/projects/b70e5138-1644-42cf-8178-53e7f918b14a/files/6f2e022f-d891-4cf5-9831-274878a1e2f7',
        startingPrompt: "You are Jean-Pierre, a poor farmer living on the outskirts of Paris in 1789. The harvest was poor, and the King has raised taxes again to fund lavish parties. Your family is hungry, and your neighbors are whispering of revolution. A crowd is gathering in the village square, their voices rising in anger. Your wife, Marie, looks at you with worried eyes, clutching your young son's hand.",
    },
    {
        id: "viking-age",
        name: "Viking Age: Raider or Trader?",
        description: "Sail into the unknown — plunder or prosper?",
        cardImage: 'https://storage.googleapis.com/aistudio-v2-a-prod-0/projects/b70e5138-1644-42cf-8178-53e7f918b14a/files/94f5060e-6e42-498b-96d5-470007e0303c',
        startingPrompt: "You are Bjorn, a young Jarl in a small fjord village in Norway, 870 AD. The elders speak of raiding the western lands of England for silver and glory. Others suggest a risky but potentially profitable trading voyage to the south, to Miklagard. Your new longship, 'Sea Serpent', is ready. The crew looks to you for a decision.",
    },
    {
        id: "roman-empire",
        name: "Rome: Rise of a Centurion",
        description: "Lead with honor… or fall to ambition.",
        cardImage: 'https://storage.googleapis.com/aistudio-v2-a-prod-0/projects/b70e5138-1644-42cf-8178-53e7f918b14a/files/42416f40-3b8c-48c0-843e-c6c94412f864',
        startingPrompt: "You are Gaius, a newly recruited legionary in Gaul, 52 BC. The land is in open rebellion under Vercingetorix. Your Centurion is a harsh but respected veteran. Rations are low, and the air is thick with tension. You are on patrol when you spot a Gallic scout in the woods. He hasn't seen you yet.",
    },
    {
        id: "ancient-egypt",
        name: "Egypt: Scribe of the Nile",
        description: "Unearth secrets written in sand and stone.",
        cardImage: 'https://storage.googleapis.com/aistudio-v2-a-prod-0/projects/b70e5138-1644-42cf-8178-53e7f918b14a/files/3b53f6ef-5913-40e1-a2c3-4f9016e788e3',
        startingPrompt: "You are Amenhotep, a gifted young scribe in the bustling city of Thebes, 1350 BC. The pharaoh Akhenaten has declared a new religion, causing unrest. You serve a powerful priest of the old gods who plots against the heretic king. He has given you a secret message to deliver, but the pharaoh's guards are everywhere.",
    },
    {
        id: "spartan-trials",
        name: "Greece: The Spartan Trials",
        description: "Only the brave earn the name of a warrior.",
        cardImage: 'https://storage.googleapis.com/aistudio-v2-a-prod-0/projects/b70e5138-1644-42cf-8178-53e7f918b14a/files/84a2d8a0-2f9e-4632-bd88-1c4b9d0343a4',
        startingPrompt: "You are Lycomedes, a seven-year-old boy taken from your family to begin the Spartan Agoge, 480 BC. The training is merciless, designed to forge you into an unbreakable warrior. Your instructor has pitted you against an older, stronger boy for the last piece of bread. To fail is to starve.",
    }
];

export const INITIAL_RESOURCES: Resources = {
    health: 100,
    food: 50,
    money: 10,
    influence: 10,
};