Nice. Now, I'm going to give you a very important task.                                                   
  http://localhost:5173/                                                                                    
                                                                                                            
  This is a game. It's running. this project is a game called everyoneisfine                                
                                                                                                            
  However this game has a problem. It doesn't have an API for agents. I need this game to be fully          
  programmable and testable by agents, which means that it needs an API agents can interact with through    
  the BrowserOS mcp server                                                                                  
                                                                                                            
  Example of things the agent needs to be able to do:                                                       
  - Dispatch commands src/renderer/src/commands                                                             
  - Select characters                                                                                       
  - Move characters to specific places                                                                      
  - Order characters to execute actions, like chop a tree                                                   
                                                                                                            
  This game is a colony simulator game like RimWorld but EveryoneIsFine is a game 100% developed by agents  
                                                                                                            
  Here is what I need you to do select the Character Bob and move him to position (57, 62) and then ask you to tell me where bob is.

  100% needs to be doable through an agent-friendly API.

  Should you expose this API in the window object such that agents can access it?

  Lets brainstorm this