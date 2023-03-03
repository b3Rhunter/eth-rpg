import React, { useState } from 'react';
import './App.css';
import { ethers } from "ethers";
import abi from './abi.json';
import erc20 from './erc20abi.json';

function App() {

  const [connected, setConnected] = useState(false);
  const [name, setName] = useState("please sign in");

  const [provider, setProvider] = useState();
  const [contract, setContract] = useState();
  const [signer, setSigner] = useState();

  const [characterName, setCharacterName] = useState("");
  const [characterLevel, setCharacterLevel] = useState(0);
  const [characterHealth, setCharacterHealth] = useState(0);
  const [characterExp, setCharacterExp] = useState(0);
  const [characterStrg, setCharacterStrg] = useState(0);
  const [characterDef, setCharacterDef] = useState(0);

  const [questIndex, setQuestIndex] = useState(0);
  const [quests, setQuests] = useState([null]);
  const [newQuestName, setNewQuestName] = useState("");
  const [newQuestDifficulty, setNewQuestDifficulty] = useState("1");
  const [newQuestReward, setNewQuestReward] = useState("1000");
  const [newQuestMonsterLevel, setNewQuestMonsterLevel] = useState("10");

  const [questName, setQuestName] = useState([]);
  const [questDiff, setQuestDiff] = useState([]);
  const [questReward, setQuestReward] = useState([]);
  const [questMonster, setQuestMonster] = useState([]);

  const [showQuest, setShowQuests] = useState(false);
  const [createQuestModal, setCreateQuestModal] = useState(false);

  const [pestControl, setPestControl] = useState(false);

  const contractAddress = "0x66B26b514F7FDb89512306511B3aB3a3Ca501462";
  const erc20Address = "0xC52249b679517876Fa8c77d1659E5F730c6E453d"

  const connect = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer)
      const chain = await signer.getChainId();
      if (chain !== 11155111) {
        alert("Please switch to Sepolia")
        return
      }
      await signer.signMessage("Welcome to ETH-RPG");
      setSigner(signer)
      const address = signer.getAddress();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      setContract(contract);
      const character = await contract.characters(address);
      const questList = await contract.getQuests();
      setQuests(questList)
      const { ethereum } = window;
      if (ethereum) {
        const ensProvider = new ethers.providers.InfuraProvider('mainnet');
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const displayAddress = address?.substr(0, 6) + "...";
        const ens = await ensProvider.lookupAddress(address);
        if (ens !== null) {
          setName(ens)
        } else {
          setName(displayAddress)
        }
      } else {
        alert('no wallet detected!')
      }
      setConnected(true)
      if (character.health.toString() === "0") {
        setCharacterHealth("DEAD!");
      } else {
        setCharacterHealth(character.health.toString());
      }
      setCharacterName(character.name.toString())
      setCharacterLevel(character.level.toString());
      setCharacterExp(parseFloat(ethers.utils.formatEther(character.experience.toString())).toFixed(0));
      setCharacterStrg(character.strength.toString());
      setCharacterDef(character.defense.toString())
      console.log(character.name.toString())
      console.log(character.level.toString())
      console.log(character.health.toString())
    } catch (error) {
      alert(error.message)
    }
    getQuests()
  }

  const createCharacter = async () => {
    try {
      const tx = await contract.createCharacter(characterName);
      const receipt = await tx.wait();
      console.log(receipt)
      const character = await contract.characters(signer.getAddress());
      console.log(character.level.toString())
      console.log(character.health.toString())
      setCharacterName(character.name.toString())
      setCharacterLevel(character.level.toString());
      setCharacterHealth(character.health.toString());
      setCharacterExp(character.experience.toString());
      setCharacterStrg(character.strength.toString());
      setCharacterDef(character.defense.toString())
    } catch (error) {
      alert(error.message)
      console.log(error.message)
    }
  }

  const addQuest = async () => {
    try {
      const tx = await contract.addQuest(newQuestName, newQuestDifficulty, newQuestReward, newQuestMonsterLevel);
      const receipt = await tx.wait();
      console.log(receipt);
      if (contract.quests.length > 0) {
        const newQuest = await contract.quests(contract.quests.length - 1);
        console.log(newQuest);
      }
      alert('Quest Created!')
    } catch (error) {
      alert(error.message)
      console.log(error.message);
    }
  };



  async function startQuest(questIndex) {
    try {
      openQuest()
      const tx = await contract.startQuest(questIndex);
      const receipt = await tx.wait();
      console.log(receipt)
      const character = await contract.characters(provider.getSigner().getAddress());
      console.log('Level: ' + character.level.toString())
      console.log('Health: ' + character.health.toString())
      console.log('Defense: ' + character.defense.toString())
      console.log('Exp: ' + character.experience.toString())
      console.log('Strength: ' + character.strength.toString())
      if (character.health.toString() === "0") {
        setCharacterLevel("0");
        setCharacterHealth("DEAD!");
        setCharacterExp("0");
        setCharacterStrg("0");
        setCharacterDef("0")
      } else {
        setCharacterLevel(character.level.toString());
        setCharacterHealth(character.health.toString());
        setCharacterExp(parseFloat(ethers.utils.formatEther(character.experience.toString())).toFixed(0));
        setCharacterStrg(character.strength.toString());
        setCharacterDef(character.defense.toString());
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  async function getQuests() {
    try {
      const tx = await contract.getQuests();
      const questNames = [];
      const questDifficulties = [];
      const questRewards = [];
      const questMonsters = [];

      for (let i = 0; i < tx.length; i++) {
        questNames.push(tx[i][0]);
        questDifficulties.push(tx[i][1].toString());
        questRewards.push(tx[i][2].toString());
        questMonsters.push(tx[i][3].toString());
      }
      setQuestName(questNames);
      setQuestDiff(questDifficulties);
      setQuestReward(questRewards);
      setQuestMonster(questMonsters);
      console.log(tx);
    } catch (error) {
      console.log(error.message);
    }
  }

  async function buryCharacter() {
    try {
      const user = signer.getAddress()
      const address = erc20Address;
      const rpgAddress = "0x66B26b514F7FDb89512306511B3aB3a3Ca501462";
      const erc20Contract = new ethers.Contract(address, erc20, signer);
      const balance = await erc20Contract.balanceOf(user);
      const approve = await erc20Contract.approve(rpgAddress, balance);
      const tx1 = await approve.wait()
      console.log(tx1)
      const tx = await contract.bury();
      const receipt = await tx.wait();
      console.log(receipt)
      setCharacterLevel("0");
      setCharacterHealth("Buried!");
      setCharacterExp("0");
      setCharacterStrg("0");
      setCharacterDef("0")
    } catch (error) {
      alert(error.message)
    }
  }

  const displayQuests = async () => {
    try {
      const chkQuests = await getQuests();
      const reciept = await chkQuests;
      reciept.wait()
    } catch (error) {
      console.log(error)
    }
    getQuests()
    setShowQuests(true)
  }

  const healthPotion = async () => {
    try {
      const tx = await contract.healthPotion();
      const receipt = await tx.wait();
      console.log(receipt)
    } catch (error) {
      alert(error.message)
    }
  }

  const closeQuests = async () => {
    setShowQuests(false)
  }

  const displayCreateQuest = async () => {
    setCreateQuestModal(true)
  }

  const closeCreateQuest = async () => {
    setCreateQuestModal(false)
  }

  function openQuest() {
    setPestControl(true)
  }

  function closeQuest() {
    setPestControl(false)
  }


  const disconnect = async () => {
    setConnected(false)
    setName("please sign in")
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{position: "fixed", top: "0px"}}>ETH-RPG</h1>
        <h3 style={{ position: "fixed", top: "0px", left: "24px", fontSize: "24px", fontFamily: "monospace" }}>{name}</h3>

        {!connected && (
          <button style={{ position: "fixed", top: "10px", right: "24px", fontSize: "18px", fontFamily: "monospace" }} onClick={connect}>
            sign in
          </button>
        )}

        {connected && (
          <>
            <button style={{ position: "fixed", top: "10px", right: "24px", fontSize: "18px", fontFamily: "monospace" }} onClick={disconnect}>
              sign out
            </button>

            <button style={{ position: "fixed", bottom: "24px", right: "24px", fontSize: "18px", fontFamily: "monospace" }} onClick={healthPotion}>Heal</button>

            {showQuest && (
              <div className='questList hideScroll'>
                <button className='questListBtn' onClick={closeQuests}>X</button>
                {questName.length > 0 ? (
                  questName.map((name, i) => (
                    <div key={name}>
                      <div className='questContainer'>
                        <h5>{name}</h5>
                        <p>Difficulty: {questDiff[i]}</p>
                        <p>Reward: {questReward[i]}</p>
                        <div className='startBtn' onClick={() => startQuest(i)}>Start Quest</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No quests available</p>
                )}
              </div>
            )}

            {createQuestModal && (
              <>
                <div className='createQuest'>
                  <div className='createQuestContainer'>
                    <div>
                      <label htmlFor="newQuestName">Quest Name:</label>
                      <br />
                      <input type="text" id="newQuestName" value={newQuestName} onChange={(e) => setNewQuestName(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestDifficulty">Difficulty:</label>
                      <br />
                      <input type="number" id="newQuestDifficulty" value={newQuestDifficulty} onChange={(e) => setNewQuestDifficulty(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestReward">Reward:</label>
                      <br />
                      <input type="number" id="newQuestReward" value={newQuestReward} onChange={(e) => setNewQuestReward(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestMonsterLevel">Monster Level:</label>
                      <br />
                      <input type="number" id="newQuestMonsterLevel" value={newQuestMonsterLevel} onChange={(e) => setNewQuestMonsterLevel(e.target.value)} />
                    </div>
                    <button className='createQuestsBtn' onClick={addQuest}>Create Quest</button>
                    <button className='closeCreateQuest' onClick={closeCreateQuest}>X</button>
                  </div>
                </div>
              </>
            )}

            <div className='hero'>
              <p>Hero: {characterName}</p>
              <p>Level: {characterLevel}</p>
              <p>Health: {characterHealth}</p>
              <p>Exp: {characterExp}</p>
              <p>Strength: {characterStrg}</p>
              <p>Defense: {characterDef}</p>
              <hr />
              <div>
                <label htmlFor="characterName">Hero Name:</label>
                <br />
                <input type="text" id="characterName" value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
              </div>
              <div>
                <button className='getQuests' onClick={createCharacter}>Create Character</button>
              </div>
              <div>
                <button className='getQuests' onClick={buryCharacter}>Bury Character</button>
              </div>
              <div>
                <button className='getQuests' onClick={displayQuests}>Quest List</button>
              </div>
              <div>
                <button className='getQuests' onClick={displayCreateQuest}>Create Quest</button>
              </div>
            </div>



            {pestControl && (
            <div className='pestControl hideScroll' onClick={closeQuest}>
            <h2>Pest Control</h2>
            <p>
            The town of Alderstone had been plagued by a rodent infestation for weeks. The rats were everywhere, scurrying through the streets, gnawing on food stores, and even attacking livestock. The townspeople had tried everything to get rid of them, but nothing seemed to work. Desperate for a solution, they turned to a group of adventurers passing through town.
            </p>
            <p>
            The adventurers, a ragtag group consisting of a dwarf fighter, a human wizard, an elf rogue, and a half-orc barbarian, agreed to take on the quest. The town's mayor promised them a generous reward if they could clear out the rats and restore order to Alderstone.
            </p>
            <p>
            The adventurers set out to the source of the infestation, a sprawling network of tunnels beneath the town. Armed with weapons, magic, and torches, they descended into the dark, dank tunnels. The air was thick with the stench of rat droppings and the sound of scurrying feet.
            </p>
            <p>
            The dwarf led the way, his trusty battleaxe at the ready. The rogue followed close behind, her keen eyes scanning the shadows for any sign of movement. The wizard brought up the rear, his hands crackling with arcane energy, while the half-orc bellowed a battle cry and charged ahead.
            </p>
            <p>
            The rats were everywhere, swarming around the adventurers, biting and clawing at their ankles. The party fought back fiercely, hacking and slashing with their weapons and casting spells of fire and lightning. The rats were no match for the adventurers' skill and bravery, and soon the tunnels were littered with rat corpses.
            </p>
            <p>
            But the worst was yet to come. Deeper in the tunnels, the adventurers encountered the rat king, a monstrous creature the size of a horse with a crown of sharp teeth and glowing red eyes. The rat king let out a deafening squeal and charged at the adventurers, its razor-sharp claws slashing through the air.
            </p>
            <p>
            The battle was long and grueling, but the adventurers prevailed. The rat king fell to the ground, its lifeless body twitching in the dim light. With the rat king dead, the rest of the rats fled the tunnels, leaving Alderstone rat-free at last.
            </p>
            <p>
            The townspeople cheered as the adventurers emerged from the tunnels, covered in rat blood and triumphantly hoisting the rat king's head. The mayor presented them with the promised reward, a chest filled with gold and precious gems, and hailed them as heroes of Alderstone.
            </p>
            <p>
            And so the adventurers continued on their journey, richer in both gold and glory, and with the satisfaction of a job well done.
            </p>
          </div>
            )}

          </>
        )}
      </header>
    </div>
  );
}

export default App;
