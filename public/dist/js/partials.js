<<<<<<< HEAD
!function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor.html",'<div id="editor"><progress-line></progress-line><editor-controls></editor-controls><time-line></time-line><editor-tracks></editor-tracks></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/home.html",'<div class="container"><div class="row"><div class="column logo"><img src="dist/images/logo.png" class="u-max-full-width" alt=""></div></div><div class="center"><a href="" class="topcoat-button--large full-button" ng-click="authenticate(\'facebook\')"><i class="fa fa-facebook-square"></i> Login to start composing</a></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/project.html",'<div class="container"><div class="center boxed"><div><img class="profile-picture-large" ng-src="{{user.picture}}"></div><div>{{user.displayName}}</div></div><div class="center"><div class="row"><div class="six columns"><h3>Your arrangements <button class="topcoat-button" ng-click="add()"><i class="fa fa-plus"></i> Add Arrangement</button></h3><ul class="list"><li ng-repeat="project in projects"><a href="#/editor/{{project._id}}"><i class="fa fa-music"></i>&nbsp; {{project.title}}</a> <button class="topcoat-button" ng-click="remove(project)"><i class="fa fa-remove"></i></button></li></ul><h3>Shared</h3><ul class="list"><li ng-repeat="project in shared"><a href="#/editor/{{project.arrangement}}"><i class="fa fa-music"></i>&nbsp; {{project.title}}</a></li></ul></div><div class="six columns"><h3>Users</h3><ul class="list"><li ng-repeat="_user in users"><div class="profile"><img class="profile-picture-thumb" ng-src="{{_user.picture}}"> {{_user.displayName}}</div></li></ul></div></div></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/communication-panel.html",'<div class="menu-header"><span>Chatting</span> <span class="icon-cancel close" ng-click="hideCommunicationPanel()"></span></div><div class="communication-panel-streams"><form ng-submit="send()"><img class="profile-picture large" ng-src="{{user.picture}}"> <input type="text" class="topcoat-text-input--large chat-input" placeholder="Input message here..." ng-model="message"> <button type="submit" class="topcoat-button--large--cta chat-button">Send</button> <button class="topcoat-button--large chat-button" ui-sref="logout">Logout</button></form><ul class="chats"><li ng-repeat="chat in chats"><img class="profile-picture large" ng-src="{{chat.user.picture}}"><div class="name">{{chat.user.displayName}}</div><small time="" number="chat.time" class="date"></small><p>{{chat.content}}</p></li></ul></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/controls.html",'<div class="master-track"><div class="controls"><button class="topcoat-button play-pause" ng-click="playPause()"><div ng-class="isPlaying()"></div></button> <button class="topcoat-button stop" ng-click="stop()"><div class="icon-stop"></div></button> <input type="range" class="topcoat-range gain" min="0" max="1" step="0.1" ng-model="gain"> <input type="range" class="topcoat-range zoom" min="10" max="200" step="10" ,="" value="30" ng-model="config.pixelsPerSecond" ng-disabled="playing"> <button class="topcoat-button record-mock">Record</button> <button class="topcoat-button profile" ng-click="showCommunication()"><img class="profile-picture" ng-src="{{user.picture}}"> {{user.displayName}}</button> <button class="topcoat-button file-browser" ng-click="showFiles()">File Browser</button> <button class="topcoat-button profile" ng-click="showShare()">Share</button><div ng-show="isFileBrowserVisible()" file-browser="" id="file-browser"></div><div ng-show="isCommunicationPanelVisible()" communication-panel="" id="communication-panel"></div><div ng-show="isSharePanelVisible()" share-panel="" id="share-panel"></div><button class="topcoat-button add-track" ng-click="showMenu = !showMenu">Add Track</button><ul class="add-track-menu" ng-show="showMenu"><li ng-click="addTrack(\'recording\')">Recording</li><li ng-click="addTrack(\'drums\')">Drums</li><li ng-click="addTrack(\'synthesizer\')">Synthesizer</li></ul></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/file-browser.html",'<div class="menu-header"><span>File Browser</span> <span class="icon-cancel close" ng-click="hideFileBrowser()"></span></div><ul><li ng-repeat="file in files track by file.id" ng-class="{active: isActiveFile(file.name)}"><span contenteditable="" ng-model="file.name">{{ file.name }}</span> <span class="icon-cancel remove" ng-click="removeBuffer(file)"></span> <span class="icon-move drag" draggable="true" data-buffer-id="{{ file.id }}"></span></li></ul>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/share-panel.html",'<div class="menu-header"><span>Share Arrangement</span> <span class="icon-cancel close" ng-click="hideSharePanel()"></span></div><div class="communication-panel-streams"><ul class="chats"><li ng-repeat="item in shared"><img class="profile-picture large" ng-src="{{item.profile.picture}}"><div class="name">{{item.profile.displayName}}</div><button class="topcoat-button" ng-click="remove(item)"><i class="fa fa-remove"></i></button></li></ul><h3>Invite</h3><ul class="chats"><li ng-repeat="user in users"><img class="profile-picture large" ng-src="{{user.picture}}"><div class="name">{{user.displayName}}</div><button class="topcoat-button" ng-click="add(user)">Invite</button></li></ul></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/track.html",'<div class="track"><div class="controls"><button class="topcoat-icon-button--quiet add-piece" ng-click="addPiece()"><span class="topcoat-icon icon-plus"></span></button> <button class="topcoat-icon-button--quiet remove-track" ng-click="removeTrack()"><span class="topcoat-icon icon-cancel remove"></span></button><div class="label" contenteditable="" ng-model="track.title">{{ track.title }}</div><input type="range" class="topcoat-range gain" min="0" max="1" step="0.1" ng-model="track.gain"><div class="track-settings topcoat-button-bar"><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button mute" ng-class="{active: muted}" ng-click="toggleMute()">Mute</button></div><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button solo" ng-class="{active: solo}" ng-click="toggleSolo()">Solo</button></div><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button effects">Effects</button></div></div></div><div class="pieces" ng-repeat="piece in track.pieces track by piece.id"><div ng-switch="" on="piece.type"><buffered-piece ng-switch-when="buffer" ng-model="piece"></buffered-piece><drum-piece ng-switch-when="drum" ng-model="piece"></drum-piece><synthesizer-piece ng-switch-when="synthesizer" ng-model="piece"></synthesizer-piece></div></div></div><div class="additional-content" id="additional-content-{{track.id}}"></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/tracks.html",'<editor-track ng-repeat="track in arrangement.tracks track by track.id"></editor-track>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/beats_grid.html",'<table><tr ng-repeat="instrument in instruments"><td>{{ instrument }}</td><td ng-repeat="beat in node[currentPatternName].data.beats[instrument] track by $index" ng-class="{ beat: beat, nobeat: !beat, currentbeat: (loopBeat == $index) }" ng-click="changeBeat(instrument, $index, beat)"></td></tr></table>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/buffered_piece.html",'<div class="piece buffered" draggable-editor-element="" draggable-piece="" ng-click="copyPiece($event)"><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" wave-form="" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/buffered_piece_edit.html",'<div class="vertical-button-container"><button class="topcoat-button record" ng-click="playSelection()">Play Selection</button> <button class="topcoat-button play" ng-click="applySelection()">Apply Selection</button></div><div class="range-container"><div class="duo-range" duo-range=""></div><div class="curtain"><div class="left"></div><div class="right"></div><canvas height="80" wave-form="" ignoreoffsets=""></canvas></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/drum_piece.html",'<div class="piece drum" draggable-editor-element="" draggable-piece=""><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/drum_piece_edit.html",'<div class="left-container"><div class="pattern-container"><div ng-class="{active: isCurrentPattern(\'a\')}" draggable="true" data-pattern-name="a" ng-click="showPart(\'a\')">A</div><div ng-class="{active: isCurrentPattern(\'b\')}" draggable="true" data-pattern-name="b" ng-click="showPart(\'b\')">B</div><div ng-class="{active: isCurrentPattern(\'c\')}" draggable="true" data-pattern-name="c" ng-click="showPart(\'c\')">C</div><div ng-class="{active: isCurrentPattern(\'d\')}" draggable="true" data-pattern-name="d" ng-click="showPart(\'d\')">D</div><div ng-class="{active: isCurrentPattern(\'e\')}" draggable="true" data-pattern-name="e" ng-click="showPart(\'e\')">E</div><div ng-class="{active: isCurrentPattern(\'f\')}" draggable="true" data-pattern-name="f" ng-click="showPart(\'f\')">F</div></div><h4>Pattern settings</h4><div class="bpm-chooser"><div>BPM:</div><input type="number" ng-model="node[currentPatternName].data.bpm" min="55" max="200"></div><div class="slot-chooser"><div>Slots:</div><input type="number" ng-model="node[currentPatternName].data.slots" min="8" max="32" ng-change="changeSlots()"></div><h4>Drum settings</h4><div class="kit-chooser"><div>Kit:</div><select ng-model="piece.drumType"><option ng-repeat="kit in avalaibleDrumkits">{{ kit }}</option></select></div></div><div class="right-container"><div class="beats-container"><div beats-grid="" ng-model="node.currentPattern"></div></div><div class="parts-order-container"><span class="pattern-description">Pattern order:</span><div class="pattern" ng-repeat="pattern in piece.patternOrder track by $index"><span class="move-left" ng-click="movePatternRight($index)" ng-if="!$first"><</span> <span class="pattern-element" ng-dblclick="removeFromPatternOrder($index)">{{ pattern }}</span> <span class="move-right" ng-click="movePatternLeft($index)" ng-if="!$last">></span></div></div><div class="controls"><button class="topcoat-button play-pause" ng-click="startStopPlayback()"><div ng-class="playState()"></div></button></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synthesizer_piece.html",'<div class="piece synthesizer" draggable-editor-element="" draggable-piece=""><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synthesizer_piece_edit.html",'<div class="notes-grid"><div ng-repeat="note in node.notes" class="note-row"><div class="note-key" ng-class="{ black: note.length > 2 }"></div><div class="tone-container" ng-dblclick="addTone(note, $event)" style="height: 15px;"><div class="synth-tone" synth-tone="" draggable-piece="" draggable-editor-element="" position="tone.position" ng-repeat="tone in node.tonesByNote(note) track by tone.id" ng-dblclick="removeTone(tone, $event)"></div></div></div></div><div class="row"><div class="oscillators"><div class="oscillator block unit"><h4>Oscillator 1</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc1.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc1.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc1.gain" min="0" ,="" max="1" step=".01"></div></div><div class="oscillator block unit"><h4>Oscillator 2</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc2.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc2.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc2.gain" min="0" ,="" max="1" step=".01"></div></div><div class="oscillator block unit"><h4>Oscillator 3</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc3.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc3.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc3.gain" min="0" ,="" max="1" step=".01"></div></div><div class="block unit"><h4>Envelope</h4><div class="sub-row"><div class="title">Attack</div><input type="range" class="topcoat-range attack" ng-model="synthSettings.toneEnvelope.attack" min="0" max="1" step=".01"></div><div class="sub-row"><div class="title">Boost</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.boost" min="0" max="1" step=".01"></div><div class="sub-row"><div class="title">Decay</div><input type="range" class="topcoat-range decay" ng-model="synthSettings.toneEnvelope.decay" min="0" max="1" step=".01"></div></div><div class="block unit"><div class="sub-row"><div class="title">Sustain</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.sustain" min="0" max="2" step=".01"></div><div class="sub-row"><div class="title">Release</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.release" min="0" max="1" step=".01"></div></div></div></div><div class="row unit filter lefty"><div class="block"><h4>Filter</h4><div class="sub-row"><div class="title">Type</div><select class="filtertype topcoat-select" ng-model="synthSettings.filter.type"><option ng-repeat="type in node.filterTypes">{{ type }}</option></select></div><div class="sub-row"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.filter.detune" min="-1200" max="1200" step="50"></div><div class="sub-row"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.filter.gain" min="0" ,="" max="1" step=".01"></div></div><div class="block"><div class="sub-row"><div class="title">Q</div><input type="range" class="topcoat-range q" ng-model="synthSettings.filter.Q" min="0" ,="" max="2" step=".01"></div><div class="sub-row"><div class="title">Cutoff</div><input type="range" class="topcoat-range cutoff" ng-model="synthSettings.filter.frequency" min="0" ,="" max="22000" step=".01"></div><div class="sub-row"><div class="title">Active</div><label class="topcoat-checkbox"><input type="checkbox" ng-model="synthSettings.filter.activate"><div class="topcoat-checkbox__checkmark"></div></label></div></div></div><div class="row lfo unit lefty"><div class="block force-margin"><h4>LFO</h4><div class="sub-row"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.lfo.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="sub-row"><div class="title">Freq</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.lfo.frequency" min="0" ,="" max="20" step="1"></div></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synth_tone.html",'<div class="tone"></div><div class="width-handle" draggable-editor-element=""></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/recording/recording-element.html",'<div class="recording-container"><div class="visualization-container"><canvas level-control="" ng-model="node" height="60" width="20"></canvas><canvas frequency-spectrum=""></canvas></div><div class="vertical-button-container"><label class="topcoat-checkbox"><input type="checkbox" ng-model="speakers"><div class="topcoat-checkbox__checkmark"></div><span>Speakers?</span></label> <button class="topcoat-button record" ng-click="triggerRecording()" ng-class="{\'animation--pulsing-border\': isRecording}">Record</button> <button class="topcoat-button play" ng-click="playRecording()" ng-show="recordedNode">Play Recording</button> <button class="topcoat-button upload" ng-click="uploadRecording()" ng-show="recordedNode">Upload Recording</button><div ng-if="isUploading">Progress {{uploadProgress}}%</div><button class="topcoat-button cancel" ng-click="cancelRecording()">Cancel</button></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/recording/recording-selection.html",'<div class="vertical-button-container"><button class="topcoat-button play-selection" ng-click="playSelection()">Play Selection</button> <button class="topcoat-button upload-selection" ng-click="uploadSelection()">Upload Selection</button> <button class="topcoat-button delete-recording" ng-click="deleteRecording()">Delete Recording</button></div><canvas wave-form="" height="80"></canvas>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/ui_elements/duo_range.html",'<div class="left handle" duo-range-handle="left" draggable-editor-element=""></div><div class="right handle" duo-range-handle="right" draggable-editor-element=""></div>')}])}();
=======
!function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor.html",'<div id="editor"><progress-line></progress-line><editor-controls></editor-controls><time-line></time-line><editor-tracks></editor-tracks></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/home.html",'<div class="container"><div class="row"><div class="column logo"><img src="dist/images/logo.png" class="u-max-full-width" alt=""></div></div><div class="center"><a href="" class="topcoat-button--large full-button" ng-click="authenticate(\'facebook\')"><i class="fa fa-facebook-square"></i> Login to start composing</a></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/base/editor.html","")}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/base/home.html","")}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/communication-panel.html",'<div class="menu-header"><span>Chatting</span> <span class="icon-cancel close" ng-click="hideCommunicationPanel()"></span></div><div class="communication-panel-streams"><form ng-submit="send()"><img class="profile-picture large" ng-src="{{user.picture}}"> <input type="text" class="topcoat-text-input--large chat-input" placeholder="Input message here..." ng-model="message"> <button type="submit" class="topcoat-button--large--cta chat-button">Send</button> <button class="topcoat-button--large chat-button" ui-sref="logout">Logout</button></form><ul class="chats"><li ng-repeat="chat in chats"><img class="profile-picture large" ng-src="{{chat.user.picture}}"><div class="name">{{chat.user.displayName}}</div><small time="" number="chat.time" class="date"></small><p>{{chat.content}}</p></li></ul></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/controls.html",'<div class="master-track"><div class="controls"><button class="topcoat-button play-pause" ng-click="playPause()"><div ng-class="isPlaying()"></div></button> <button class="topcoat-button stop" ng-click="stop()"><div class="icon-stop"></div></button> <input type="range" class="topcoat-range gain" min="0" max="1" step="0.1" ng-model="gain"> <input type="range" class="topcoat-range zoom" min="10" max="200" step="10" ,="" value="30" ng-model="config.pixelsPerSecond" ng-disabled="playing"> <button class="topcoat-button record-mock">Record</button> <button class="topcoat-button profile" ng-click="showCommunication()"><img class="profile-picture" ng-src="{{user.picture}}"> {{user.displayName}}</button> <button class="topcoat-button file-browser" ng-click="showFiles()">File Browser</button><div ng-show="isFileBrowserVisible()" file-browser="" id="file-browser"></div><div ng-show="isCommunicationPanelVisible()" communication-panel="" id="communication-panel"></div><button class="topcoat-button add-track" ng-click="showMenu = !showMenu">Add Track</button><ul class="add-track-menu" ng-show="showMenu"><li ng-click="addTrack(\'recording\')">Recording</li><li ng-click="addTrack(\'drums\')">Drums</li><li ng-click="addTrack(\'synthesizer\')">Synthesizer</li></ul></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/file-browser.html",'<div class="menu-header"><span>File Browser</span> <span class="icon-cancel close" ng-click="hideFileBrowser()"></span></div><ul><li ng-repeat="file in files track by file.id" ng-class="{active: isActiveFile(file.name)}"><span contenteditable="" ng-model="file.name">{{ file.name }}</span> <span class="icon-cancel remove" ng-click="removeBuffer(file)"></span> <span class="icon-move drag" draggable="true" data-buffer-id="{{ file.id }}"></span></li></ul>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/track.html",'<div class="track"><div class="controls"><button class="topcoat-icon-button--quiet add-piece" ng-click="addPiece()"><span class="topcoat-icon icon-plus"></span></button> <button class="topcoat-icon-button--quiet remove-track" ng-click="removeTrack()"><span class="topcoat-icon icon-cancel remove"></span></button><div class="label" contenteditable="" ng-model="track.title">{{ track.title }}</div><input type="range" class="topcoat-range gain" min="0" max="1" step="0.1" ng-model="track.gain"><div class="track-settings topcoat-button-bar"><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button mute" ng-class="{active: muted}" ng-click="toggleMute()">Mute</button></div><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button solo" ng-class="{active: solo}" ng-click="toggleSolo()">Solo</button></div><div class="topcoat-button-bar__item"><button class="topcoat-button-bar__button effects">Effects</button></div></div></div><div class="pieces" ng-repeat="piece in track.pieces track by piece.id"><div ng-switch="" on="piece.type"><buffered-piece ng-switch-when="buffer" ng-model="piece"></buffered-piece><drum-piece ng-switch-when="drum" ng-model="piece"></drum-piece><synthesizer-piece ng-switch-when="synthesizer" ng-model="piece"></synthesizer-piece></div></div></div><div class="additional-content" id="additional-content-{{track.id}}"></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/editor/tracks.html",'<editor-track ng-repeat="track in arrangement.tracks track by track.id"></editor-track>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/beats_grid.html",'<table><tr ng-repeat="instrument in instruments"><td>{{ instrument }}</td><td ng-repeat="beat in node[currentPatternName].data.beats[instrument] track by $index" ng-class="{ beat: beat, nobeat: !beat, currentbeat: (loopBeat == $index) }" ng-click="changeBeat(instrument, $index, beat)"></td></tr></table>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/buffered_piece.html",'<div class="piece buffered" draggable-editor-element="" draggable-piece="" ng-click="copyPiece($event)"><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" wave-form="" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/buffered_piece_edit.html",'<div class="vertical-button-container"><button class="topcoat-button record" ng-click="playSelection()">Play Selection</button> <button class="topcoat-button play" ng-click="applySelection()">Apply Selection</button></div><div class="range-container"><div class="duo-range" duo-range=""></div><div class="curtain"><div class="left"></div><div class="right"></div><canvas height="80" wave-form="" ignoreoffsets=""></canvas></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/drum_piece.html",'<div class="piece drum" draggable-editor-element="" draggable-piece=""><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/drum_piece_edit.html",'<div class="left-container"><div class="pattern-container"><div ng-class="{active: isCurrentPattern(\'a\')}" draggable="true" data-pattern-name="a" ng-click="showPart(\'a\')">A</div><div ng-class="{active: isCurrentPattern(\'b\')}" draggable="true" data-pattern-name="b" ng-click="showPart(\'b\')">B</div><div ng-class="{active: isCurrentPattern(\'c\')}" draggable="true" data-pattern-name="c" ng-click="showPart(\'c\')">C</div><div ng-class="{active: isCurrentPattern(\'d\')}" draggable="true" data-pattern-name="d" ng-click="showPart(\'d\')">D</div><div ng-class="{active: isCurrentPattern(\'e\')}" draggable="true" data-pattern-name="e" ng-click="showPart(\'e\')">E</div><div ng-class="{active: isCurrentPattern(\'f\')}" draggable="true" data-pattern-name="f" ng-click="showPart(\'f\')">F</div></div><h4>Pattern settings</h4><div class="bpm-chooser"><div>BPM:</div><input type="number" ng-model="node[currentPatternName].data.bpm" min="55" max="200"></div><div class="slot-chooser"><div>Slots:</div><input type="number" ng-model="node[currentPatternName].data.slots" min="8" max="32" ng-change="changeSlots()"></div><h4>Drum settings</h4><div class="kit-chooser"><div>Kit:</div><select ng-model="piece.drumType"><option ng-repeat="kit in avalaibleDrumkits">{{ kit }}</option></select></div></div><div class="right-container"><div class="beats-container"><div beats-grid="" ng-model="node.currentPattern"></div></div><div class="parts-order-container"><span class="pattern-description">Pattern order:</span><div class="pattern" ng-repeat="pattern in piece.patternOrder track by $index"><span class="move-left" ng-click="movePatternRight($index)" ng-if="!$first"><</span> <span class="pattern-element" ng-dblclick="removeFromPatternOrder($index)">{{ pattern }}</span> <span class="move-right" ng-click="movePatternLeft($index)" ng-if="!$last">></span></div></div><div class="controls"><button class="topcoat-button play-pause" ng-click="startStopPlayback()"><div ng-class="playState()"></div></button></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synthesizer_piece.html",'<div class="piece synthesizer" draggable-editor-element="" draggable-piece=""><div class="remove icon-cancel" ng-click="remove()"></div><canvas height="80" ng-dblclick="edit()"></canvas></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synthesizer_piece_edit.html",'<div class="notes-grid"><div ng-repeat="note in node.notes" class="note-row"><div class="note-key" ng-class="{ black: note.length > 2 }"></div><div class="tone-container" ng-dblclick="addTone(note, $event)" style="height: 15px;"><div class="synth-tone" synth-tone="" draggable-piece="" draggable-editor-element="" position="tone.position" ng-repeat="tone in node.tonesByNote(note) track by tone.id" ng-dblclick="removeTone(tone, $event)"></div></div></div></div><div class="row"><div class="oscillators"><div class="oscillator block unit"><h4>Oscillator 1</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc1.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc1.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc1.gain" min="0" ,="" max="1" step=".01"></div></div><div class="oscillator block unit"><h4>Oscillator 2</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc2.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc2.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc2.gain" min="0" ,="" max="1" step=".01"></div></div><div class="oscillator block unit"><h4>Oscillator 3</h4><div class="subrow"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.osc3.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="subrow"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.osc3.detune" min="-1200" max="1200" step="50"></div><div class="subrow"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.osc3.gain" min="0" ,="" max="1" step=".01"></div></div><div class="block unit"><h4>Envelope</h4><div class="sub-row"><div class="title">Attack</div><input type="range" class="topcoat-range attack" ng-model="synthSettings.toneEnvelope.attack" min="0" max="1" step=".01"></div><div class="sub-row"><div class="title">Boost</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.boost" min="0" max="1" step=".01"></div><div class="sub-row"><div class="title">Decay</div><input type="range" class="topcoat-range decay" ng-model="synthSettings.toneEnvelope.decay" min="0" max="1" step=".01"></div></div><div class="block unit"><div class="sub-row"><div class="title">Sustain</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.sustain" min="0" max="2" step=".01"></div><div class="sub-row"><div class="title">Release</div><input type="range" class="topcoat-range release" ng-model="synthSettings.toneEnvelope.release" min="0" max="1" step=".01"></div></div></div></div><div class="row unit filter lefty"><div class="block"><h4>Filter</h4><div class="sub-row"><div class="title">Type</div><select class="filtertype topcoat-select" ng-model="synthSettings.filter.type"><option ng-repeat="type in node.filterTypes">{{ type }}</option></select></div><div class="sub-row"><div class="title">Detune</div><input type="range" class="topcoat-range detune" ng-model="synthSettings.filter.detune" min="-1200" max="1200" step="50"></div><div class="sub-row"><div class="title">Gain</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.filter.gain" min="0" ,="" max="1" step=".01"></div></div><div class="block"><div class="sub-row"><div class="title">Q</div><input type="range" class="topcoat-range q" ng-model="synthSettings.filter.Q" min="0" ,="" max="2" step=".01"></div><div class="sub-row"><div class="title">Cutoff</div><input type="range" class="topcoat-range cutoff" ng-model="synthSettings.filter.frequency" min="0" ,="" max="22000" step=".01"></div><div class="sub-row"><div class="title">Active</div><label class="topcoat-checkbox"><input type="checkbox" ng-model="synthSettings.filter.activate"><div class="topcoat-checkbox__checkmark"></div></label></div></div></div><div class="row lfo unit lefty"><div class="block force-margin"><h4>LFO</h4><div class="sub-row"><div class="title">Type</div><select class="wavetype topcoat-select" ng-model="synthSettings.lfo.type"><option ng-repeat="type in node.oscillatorTypes">{{ type }}</option></select></div><div class="sub-row"><div class="title">Freq</div><input type="range" class="topcoat-range gain" ng-model="synthSettings.lfo.frequency" min="0" ,="" max="20" step="1"></div></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/pieces/synth_tone.html",'<div class="tone"></div><div class="width-handle" draggable-editor-element=""></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/ui_elements/duo_range.html",'<div class="left handle" duo-range-handle="left" draggable-editor-element=""></div><div class="right handle" duo-range-handle="right" draggable-editor-element=""></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/recording/recording-element.html",'<div class="recording-container"><div class="visualization-container"><canvas level-control="" ng-model="node" height="60" width="20"></canvas><canvas frequency-spectrum=""></canvas></div><div class="vertical-button-container"><label class="topcoat-checkbox"><input type="checkbox" ng-model="speakers"><div class="topcoat-checkbox__checkmark"></div><span>Speakers?</span></label> <button class="topcoat-button record" ng-click="triggerRecording()" ng-class="{\'animation--pulsing-border\': isRecording}">Record</button> <button class="topcoat-button play" ng-click="playRecording()" ng-show="recordedNode">Play Recording</button> <button class="topcoat-button upload" ng-click="uploadRecording()" ng-show="recordedNode">Upload Recording</button><div ng-if="isUploading">Progress {{uploadProgress}}%</div><button class="topcoat-button cancel" ng-click="cancelRecording()">Cancel</button></div></div>')}])}(),function(t){try{t=angular.module("partials")}catch(e){t=angular.module("partials",[])}t.run(["$templateCache",function(t){t.put("partials/recording/recording-selection.html",'<div class="vertical-button-container"><button class="topcoat-button play-selection" ng-click="playSelection()">Play Selection</button> <button class="topcoat-button upload-selection" ng-click="uploadSelection()">Upload Selection</button> <button class="topcoat-button delete-recording" ng-click="deleteRecording()">Delete Recording</button></div><canvas wave-form="" height="80"></canvas>')}])}();
>>>>>>> c61961e185518ca584fa088c674592ed4ef6336d
