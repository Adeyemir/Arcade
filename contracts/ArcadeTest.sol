
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArcadeTest {
    string public message;

    constructor() {
        message = "Hello, Arcade!";
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}
