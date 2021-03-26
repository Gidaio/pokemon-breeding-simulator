type Pokemon = MalePokemon | FemalePokemon
type Stat = Exclude<keyof Pokemon, "gender">
type FitnessFunction = (a: Pokemon) => number
type FinishCondition = (a: MalePokemon, b: FemalePokemon) => boolean
type BreedingFunction = (a: MalePokemon, b: FemalePokemon, maleChance: number) => Pokemon

interface MalePokemon {
	gender: "male"
	hp: number
	attack: number
	defense: number
	specialAttack: number
	specialDefense: number
	speed: number
}

interface FemalePokemon {
	gender: "female"
	hp: number
	attack: number
	defense: number
	specialAttack: number
	specialDefense: number
	speed: number
}

const MALE_CHANCES = [0.249, 0.502, 0.8814]
const FITNESS_FUNCTIONS: FitnessFunction[] = [totalIVPercent, maxIVCount]
const FINISH_CONDITIONS: FinishCondition[] = [sixIVPair, sixIVSingle, fiveIVSingle]
const BREEDING_FUNCTIONS: BreedingFunction[] = [alwaysDestinyKnot, smartDestinyKnot, geneticBreeding]

const outputs: any = {}

for (const maleChance of MALE_CHANCES) {
	outputs[maleChance] = {}
	for (const fitnessFunction of FITNESS_FUNCTIONS) {
		outputs[maleChance][fitnessFunction.name] = {}
		for (const finishCondition of FINISH_CONDITIONS) {
			outputs[maleChance][fitnessFunction.name][finishCondition.name] = {}
			for (const breedingFunction of BREEDING_FUNCTIONS) {
				console.info(`Generating samples for ${maleChance}, ${fitnessFunction.name}, ${finishCondition.name}, ${breedingFunction.name}`)
				const eggCounts = []
				for (let i = 0; i < 10000; i++) {
					eggCounts.push(generateSample(
						maleChance,
						finishCondition,
						fitnessFunction,
						breedingFunction
					))
				}

				const average = eggCounts.reduce((sum, current) => sum + current) / eggCounts.length
				const deviations = eggCounts.map(count => (count - average) * (count - average))
				const variance = deviations.reduce((sum, current) => sum + current) / (deviations.length - 1)
				const standardDeviation = Math.sqrt(variance)
				outputs[maleChance][fitnessFunction.name][finishCondition.name][breedingFunction.name] = `${average} std dev ${standardDeviation}`
			}
		}
	}
}

console.info(JSON.stringify(outputs, null, 2))

//#region Fitness Functions
function totalIVPercent(pokemon: Pokemon): number {
	return (pokemon.hp + pokemon.attack + pokemon.defense + pokemon.specialAttack + pokemon.specialDefense + pokemon.speed) / (31 * 6)
}

function maxIVCount(pokemon: Pokemon): number {
	let fitness = 0
	if (pokemon.hp === 31) {
		fitness++
	} else {
		fitness += pokemon.hp / 200
	}
	if (pokemon.attack === 31) {
		fitness++
	} else {
		fitness += pokemon.attack / 200
	}
	if (pokemon.defense === 31) {
		fitness++
	} else {
		fitness += pokemon.defense / 200
	}
	if (pokemon.specialAttack === 31) {
		fitness++
	} else {
		fitness += pokemon.specialAttack / 200
	}
	if (pokemon.specialDefense === 31) {
		fitness++
	} else {
		fitness += pokemon.specialDefense / 200
	}
	if (pokemon.speed === 31) {
		fitness++
	} else {
		fitness += pokemon.speed / 200
	}

	return fitness / 6
}

// This one doesn't work.
function linearCombo(pokemon: Pokemon): number {
	return (pokemon.hp * 0.2
		+ pokemon.attack * 0.2
		+ pokemon.defense * 0.2
		+ pokemon.specialAttack * 0.2
		+ pokemon.specialDefense * 0.2
		+ pokemon.speed * -1) / 31
}
//#endregion


//#region Finish Conditions
function sixIVPair(a: MalePokemon, b: FemalePokemon): boolean {
	return maxIVCount(a) === 1 && maxIVCount(b) === 1
}

function sixIVSingle(a: MalePokemon, b: FemalePokemon): boolean {
	return maxIVCount(a) === 1 || maxIVCount(b) === 1
}

function fiveIVSingle(a: MalePokemon, b: FemalePokemon): boolean {
	return maxIVCount(a) >= 5 / 6 || maxIVCount(b) >= 5 / 6
}
//#endregion


//#region Breeding Functions
function noDestinyKnot(male: MalePokemon, female: FemalePokemon, maleChance: number): Pokemon {
	return gameBreeding(male, female, maleChance, 3)
}


function alwaysDestinyKnot(male: MalePokemon, female: FemalePokemon, maleChance: number): Pokemon {
	return gameBreeding(male, female, maleChance, 5)
}


function smartDestinyKnot(male: MalePokemon, female: FemalePokemon, maleChance: number): Pokemon {
	const statCount = countMaxIVs(male) + countMaxIVs(female) > 3 ? 5 : 3
	return gameBreeding(male, female, maleChance, statCount)


	function countMaxIVs(pokemon: Pokemon): number {
		return (["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as Stat[])
			.reduce((total, stat) => pokemon[stat] === 31 ? total + 1 : total, 0)
	}
}


function gameBreeding(male: MalePokemon, female: FemalePokemon, maleChance: number, statCount: number): Pokemon {
	const baby: Partial<Pokemon> = {}
	const stats: Stat[] = pickStats(statCount)
	for (const stat of stats) {
		baby[stat] = Math.random() < 0.5 ? male[stat] : female[stat]
	}

	return {
		gender: Math.random() < maleChance ? "male" : "female",
		hp: baby.hp || Math.floor(Math.random() * 32),
		attack: baby.attack || Math.floor(Math.random() * 32),
		defense: baby.defense || Math.floor(Math.random() * 32),
		specialAttack: baby.specialAttack || Math.floor(Math.random() * 32),
		specialDefense: baby.specialDefense || Math.floor(Math.random() * 32),
		speed: baby.speed || Math.floor(Math.random() * 32)
	}


	function pickStats(num: number): Stat[] {
		let stats: Stat[] = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]
		let out: Stat[] = []
		for (let i = 0; i < num; i++) {
			const randomIndex = Math.floor(Math.random() * stats.length)
			const [chosenStat] = stats.splice(randomIndex, 1)
			out.push(chosenStat)
		}

		return out
	}
}


function geneticBreeding(male: MalePokemon, female: FemalePokemon, maleChance: number): Pokemon {
	const baby: Partial<Pokemon> = {}
	baby.gender = Math.random() < maleChance ? "male" : "female"

	for (const stat of ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]) {
		// console.debug(`Calculating stat ${stat}`)
		let newStat
		if (Math.random() < 0.5) {
			// console.debug("Taking from father.")
			newStat = male[stat as Stat]
		} else {
			// console.debug("Taking from mother.")
			newStat = female[stat as Stat]
		}

		const mutationSign = Math.sign(Math.random() - 0.25)
		// console.debug(`Mutation sign: ${mutationSign}`)
		while (Math.random() < 0.05) {
			// console.debug("Mutating")
			newStat += mutationSign
		}
		baby[stat as Stat] = clamp(newStat, 0, 31)
	}

	// console.debug(`Father: ${JSON.stringify(male)}\nMother: ${JSON.stringify(female)}\nBaby: ${JSON.stringify(baby)}`)

	return baby as Pokemon


	function clamp(value: number, min: number, max: number) {
		if (value < min) {
			return min
		} else if (value > max) {
			return max
		} else {
			return value
		}
	}
}
//#endregion


function generateSample(maleChance: number, finishCondition: FinishCondition, fitness: FitnessFunction, breed: BreedingFunction): number {
	let totalEggs = 0
	const malePokemon: MalePokemon[] = []
	const femalePokemon: FemalePokemon[] = []

	while (malePokemon.length < 1 || femalePokemon.length < 1) {
		const pokemon = generatePokemon()
		if (pokemon.gender === "male") {
			malePokemon.push(pokemon)
		} else {
			femalePokemon.push(pokemon)
		}
	}

	let bestMalePokemon = malePokemon.sort((a, b) => fitness(b) - fitness(a))[0]
	let bestFemalePokemon = femalePokemon.sort((a, b) => fitness(b) - fitness(a))[0]
	while (!finishCondition(bestMalePokemon, bestFemalePokemon)) {
		const baby = breed(bestMalePokemon, bestFemalePokemon, maleChance)
		totalEggs++
		if (baby.gender === "male" && fitness(baby) > fitness(bestMalePokemon)) {
			bestMalePokemon = baby
		} else if (baby.gender === "female" && fitness(baby) > fitness(bestFemalePokemon)) {
			bestFemalePokemon = baby
		}
	}

	return totalEggs


	function generatePokemon(): Pokemon {
		return {
			gender: Math.random() < maleChance ? "male" : "female",
			hp: Math.floor(Math.random() * 32),
			attack: Math.floor(Math.random() * 32),
			defense: Math.floor(Math.random() * 32),
			specialAttack: Math.floor(Math.random() * 32),
			specialDefense: Math.floor(Math.random() * 32),
			speed: Math.floor(Math.random() * 32)
		}
	}
}
