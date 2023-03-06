// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./TestToken.sol";
import "./Base64.sol";

contract EthRpg is ERC721Enumerable {

    TestToken public testToken;
    using Strings for uint256;

    struct Character {
    string name;
    uint level;
    uint256 experience;
    uint health;
    uint strength;
    uint defense;
    string face;
    string decor;
}

struct Quest {
    string name;
    uint difficulty;
    uint reward;
    uint monsterLevel;
}

struct DailyLimit {
    uint count;
    uint lastDay;
}

uint constant BASE_EXPERIENCE = 1000000000000000000000;
uint constant EXPERIENCE_MULTIPLIER = 2;
uint constant INITIAL_TOKENS = 100;
uint256 private lastTokenId = 0;
mapping(address => DailyLimit) public limits;
mapping(address => Character) public characters;
Quest[] public quests;

event NewCharacter(address player, string name);
event NewQuest(string name, uint difficulty, uint reward, uint monsterLevel);

constructor() ERC721("EthRpg", "ERPG") {

    testToken = new TestToken();
    // initial quests
    quests.push(Quest("Pest Control", 1, 1000, 2));
    quests.push(Quest("Wolf Hunt", 5, 100000, 15));
    quests.push(Quest("Theives Den", 10, 1000000, 25));
}

  function randomNum(uint256 _mod, uint256 _seed, uint _salt) public view returns(uint256) {
      uint256 num = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, _seed, _salt))) % _mod;
      return num;
  }

  function generateRandomColorFace() internal view returns (string memory) {
    uint256 randomNum1 = randomNum(360, 3, 3);
    string memory face = string(abi.encodePacked("hsl(", randomNum1.toString(), ", 50%, 85%)"));
    return face;
}

  function generateRandomColorDecor() internal view returns (string memory) {
    uint256 randomNum2 = randomNum(360, 3, 9);
    string memory decor = string(abi.encodePacked("hsl(", randomNum2.toString(), ", 50%, 25%)"));
    return decor;
}

function createCharacter(string memory _name) public payable {
    require(characters[msg.sender].level == 0, "You already have a character!");
    require(msg.value == 0.001 ether);
    lastTokenId++;
    _safeMint(msg.sender, lastTokenId);
    string memory face = generateRandomColorFace();
    string memory decor = generateRandomColorDecor();
    characters[msg.sender] = Character(_name, 1, 0, 100, 10, 5, face, decor);
    (bool sent, ) = payable(0xBC72198d65075Fdad2CA7B8db79EfF5B51c8B30D).call{value: msg.value}("");
    require(sent, "Failed to send ether");
    emit NewCharacter(msg.sender, _name);
}

function claimTokens(uint256 experience) public {
    uint256 tokens = experience * (10**18);
    testToken.mint(msg.sender, tokens);
}

function startQuest(uint _questIndex) public {
    require(characters[msg.sender].level >= quests[_questIndex].difficulty, "Not strong enough.");
    require(characters[msg.sender].health > 0, "You are dead.");
    uint monsterLevel = quests[_questIndex].monsterLevel;
    if (characters[msg.sender].level * 2 < monsterLevel) {
        characters[msg.sender].health = 0;
    }
    bool won = battle(characters[msg.sender], monsterLevel);
    if (won) {
        characters[msg.sender].health = 100;
        characters[msg.sender].strength += 2;
        characters[msg.sender].defense += 1;
        claimTokens(quests[_questIndex].reward);
        updateExperience(); 
    } else {
        uint damage = monsterLevel * 2 - characters[msg.sender].defense;
        characters[msg.sender].health -= damage;
    }
}

function updateExperience() internal {
    uint256 tokens = testToken.balanceOf(msg.sender);
    uint currentLevel = characters[msg.sender].level;
    uint256 experienceNeeded = (BASE_EXPERIENCE) * (EXPERIENCE_MULTIPLIER ** currentLevel);
    if (tokens >= experienceNeeded) {
        characters[msg.sender].level++;
       
    }
    characters[msg.sender].experience = tokens;
}

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_exists(tokenId), "Token does not exist");

    string memory name = string(abi.encodePacked("Hero #", tokenId.toString()));
    string memory description = "EtherQuest Hero";
    string memory svg = generateSVGofTokenById();

    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "', name, '", "description": "', description, '", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'))));
    return string(abi.encodePacked("data:application/json;base64,", json));
}


function generateSVGofTokenById() internal view returns (string memory) {
    Character memory character = characters[ownerOf(lastTokenId)];
    string memory svg = string(abi.encodePacked(
      '<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">',
        renderTokenById(character),
      '</svg>'
    ));
    return svg;
}


function renderTokenById(Character memory character) internal pure returns (string memory) {
    string memory face = character.face;
    string memory decor = character.decor;
    string memory render = string(abi.encodePacked(
        '<rect id="face" fill="',face,'" x="0" y="104.52146" width="512" height="172.8173"/>',
        '<rect fill="#7f7f7f" x="0" y="277.11444" width="512" height="234.88556"/>',
        '<rect fill="#7f7f7f" x="0" y="-0.33397" width="512" height="110.68075"/>',
        '<rect id="nosePiece" fill="',decor,'" x="211.33936" y="69.56966" width="89.3213" height="332.0422"/>',
        '<rect fill="',decor,'" x="162.91666" y="0" width="186.1667" height="73.78716"/>',
        '<rect id="eyeLeft" fill="#fcfcfc" x="57.9397" y="164.71626" width="118.44781" height="66.02009" />',
        '<rect id="eyeRight" fill="#fcfcfc" x="341.86301" y="164.71626" width="118.44781" height="66.02009"/>',
        '<rect id="pupilLeft" fill="#000000" x="122.01802" y="193.84277" width="29.12651" height="27.18474"/>',
        '<rect id="pupilRight" fill="#000000" x="366.68072" y="191.901" width="29.12651" height="27.18474"/>'
    ));

    return render;
}


function addQuest(string memory _name, uint _difficulty, uint _reward, uint _monsterLevel) public {
    quests.push(Quest(_name, _difficulty, _reward, _monsterLevel));
    emit NewQuest(_name, _difficulty, _reward, _monsterLevel);
}

function battle(Character memory _character, uint _monsterLevel) internal view returns (bool) {
    uint totalStrength = _character.strength + _character.defense;
    uint monsterStrength = _monsterLevel * 3;
    bytes32 salt = keccak256(abi.encodePacked(_character.name));
    uint random = uint(keccak256(abi.encodePacked(block.timestamp, salt, _character.strength, _character.defense)));
    uint playerRoll = random % 20 + 1; // roll a d20 for the player
    uint monsterRoll = random % 20 + 1; // roll a d20 for the monster
    uint playerTotal = totalStrength + playerRoll;
    uint monsterTotal = monsterStrength + monsterRoll;
    if (playerTotal >= monsterTotal) {
        return true;
    } else {
        return false;
    }
}

function bury() public {
    require(characters[msg.sender].level > 0, "You do not have a character!");
    uint tokenCount = testToken.balanceOf(msg.sender);
    testToken.approve(address(this), tokenCount);
    testToken.burnFrom(msg.sender, tokenCount); // burn all the user's tokens
    uint tokenId = tokenOfOwnerByIndex(msg.sender, 0);
    _burn(tokenId);
    delete characters[msg.sender];
}

function getQuests() public view returns (Quest[] memory) {
    return quests;
    }

function healthPotion() public {
    uint today = block.timestamp / 1 days;
    if (limits[msg.sender].lastDay < today) {
        limits[msg.sender].lastDay = today;
        limits[msg.sender].count = 0;
    }
    require(limits[msg.sender].count < 3, "Out of potions.");
    limits[msg.sender].count++;
    characters[msg.sender].health += 25;
    if (characters[msg.sender].health > 100) {
        characters[msg.sender].health = 100;
    }
}

function setTestTokenAddress(TestToken _testToken) public {
    testToken = _testToken;
}

      function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
      if (_i == 0) {
          return "0";
      }
      uint j = _i;
      uint len;
      while (j != 0) {
          len++;
          j /= 10;
      }
      bytes memory bstr = new bytes(len);
      uint k = len;
      while (_i != 0) {
          k = k-1;
          uint8 temp = (48 + uint8(_i - _i / 10 * 10));
          bytes1 b1 = bytes1(temp);
          bstr[k] = b1;
          _i /= 10;
      }
      return string(bstr);
  }
}
