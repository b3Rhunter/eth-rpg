import React, { useState } from 'react';
import './App.css';
import { ethers } from "ethers";
import abi from './abi.json';

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
  const [createQuestModal, setCreateQuestModal] = useState(false)

  const contractAddress = "0xEb8dCa2280c9ed696A74b5A3C1C988eC859FA39C";

  const connect = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer)
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
      setCharacterExp(character.experience.toString());
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
    } catch (error) {
      console.log(error.message);
    }
  };



  async function startQuest(questIndex) {
    const tx = await contract.startQuest(questIndex);
    const receipt = await tx.wait();
    console.log(receipt)
    const character = await contract.characters(provider.getSigner().getAddress());
    console.log('Level: ' + character.level.toString())
    console.log('Health: ' + character.health.toString())
    console.log('Defense: ' + character.defense.toString())
    console.log('Exp: ' + character.experience.toString())
    console.log('Strength: ' + character.strength.toString())
    if (character.health.toString === "0") {
      setCharacterLevel("0");
      setCharacterHealth("DEAD!");
      setCharacterExp("0");
      setCharacterStrg("0");
      setCharacterDef("0")
    } else {
      setCharacterLevel(character.level.toString());
      setCharacterHealth(character.health.toString());
      setCharacterExp(character.experience.toString());
      setCharacterStrg(character.strength.toString());
      setCharacterDef(character.defense.toString())
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
    const tx = await contract.bury();
    const receipt = await tx.wait();
    console.log(receipt)
    setCharacterLevel("0");
    setCharacterHealth("Buried!");
    setCharacterExp("0");
    setCharacterStrg("0");
    setCharacterDef("0")
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

  const closeQuests = async () => {
    setShowQuests(false)
  }

  const displayCreateQuest = async () => {
    setCreateQuestModal(true)
  }

  const closeCreateQuest = async () => {
    setCreateQuestModal(false)
  }


  const disconnect = async () => {
    setConnected(false)
    setName("please sign in")
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>ETH-RPG</h1>
        <h3 style={{ position: "fixed", top: "0px", left: "24px" }}>{name}</h3>

        {!connected && (
          <button style={{ position: "fixed", top: "10px", right: "24px" }} onClick={connect}>connect</button>
        )}

        {connected && (
          <>
            <button style={{ position: "fixed", top: "10px", right: "24px" }} onClick={disconnect}>
              disconnect
            </button>

            {showQuest && (
              <div className='questList hideScroll'>
                <button onClick={closeQuests}>X</button>
                <h4>Quests</h4>
                {questName.length > 0 ? (
                  questName.map((name, i) => (
                    <div key={name}>
                      <div className='questContainer'>
                        <h5>{name}</h5>
                        <p>Difficulty: {questDiff[i]}</p>
                        <p>Reward: {questReward[i]}</p>
                        <p>Monster: {questMonster[i]}</p>
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
                      <label htmlFor="newQuestName">New Quest Name:</label>
                      <br />
                      <input type="text" id="newQuestName" value={newQuestName} onChange={(e) => setNewQuestName(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestDifficulty">New Quest Difficulty:</label>
                      <br />
                      <input type="number" id="newQuestDifficulty" value={newQuestDifficulty} onChange={(e) => setNewQuestDifficulty(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestReward">New Quest Reward:</label>
                      <br />
                      <input type="number" id="newQuestReward" value={newQuestReward} onChange={(e) => setNewQuestReward(e.target.value)} />
                    </div>
                    <br />
                    <div>
                      <label htmlFor="newQuestMonsterLevel">New Quest Monster Level:</label>
                      <br />
                      <input type="number" id="newQuestMonsterLevel" value={newQuestMonsterLevel} onChange={(e) => setNewQuestMonsterLevel(e.target.value)} />
                    </div>
                    <button className='createQuestsBtn' onClick={addQuest}>Add Quest</button>
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
          </>
        )}
      </header>
    </div>
  );
}

export default App;
