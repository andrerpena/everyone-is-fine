# Guiding Principles for Autonomous Development

- Browser agent testability: Everything you do should be testable by an agent. For example: If you're implementing combat, then you need to be able to order unit attacks through the API window.game, and every whether it worked. Needless to say, you must also makes the the visuals work in pixi.js to the player can see it.
- Code quality over speed: We are not in a hurry. It's more important to guarantee that the code is consistent, organized, simple, maintainable and testable, than it is to deliver more code faster. It's OK to refactor.

