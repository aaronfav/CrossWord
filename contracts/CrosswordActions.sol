// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CrosswordActions {
    enum Difficulty {
        Easy,
        Medium,
        Hard
    }

    event Action(
        address indexed player,
        string actionType,
        Difficulty difficulty,
        uint256 timestamp
    );

    mapping(Difficulty => uint256) public starts;
    mapping(Difficulty => uint256) public playAgains;
    mapping(Difficulty => uint256) public retries;

    function startDifficulty(Difficulty difficulty) external {
        starts[difficulty] += 1;
        emit Action(msg.sender, "start", difficulty, block.timestamp);
    }

    function playAgain(Difficulty difficulty) external {
        playAgains[difficulty] += 1;
        emit Action(msg.sender, "play_again", difficulty, block.timestamp);
    }

    function retrySameDifficulty(Difficulty difficulty) external {
        retries[difficulty] += 1;
        emit Action(msg.sender, "retry", difficulty, block.timestamp);
    }
}
