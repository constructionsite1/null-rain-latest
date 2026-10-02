import test from 'node:test';
import assert from 'node:assert/strict';
import { AimState } from '../src/aim.js';

test('precision aim alone never fires; primary and aimed sidearm are exclusive',()=>{
  const a=new AimState();a.right=true;
  assert.deepEqual(a.buttons(),{attack:false,secondary:false,aiming:true});
  a.left=true;assert.deepEqual(a.buttons(),{attack:false,secondary:true,aiming:true});
  a.right=false;assert.deepEqual(a.buttons(),{attack:true,secondary:false,aiming:false});
  a.reset();assert.equal(a.buttons().attack,false);
});
test('captured cursor moves freely in screen space and translates with the camera',()=>{
  const a=new AimState();assert.equal(a.world({x:100,y:200}),null);
  a.place(500,300,1440,810);a.move(-130,45,1440,810);
  assert.deepEqual(a.world({x:2200,y:1400}),{x:2570,y:1745});
  assert.deepEqual(a.world({x:2250,y:1450}),{x:2620,y:1795});
  a.move(-5000,5000,1440,810);assert.equal(a.x,12);assert.equal(a.y,798);
});
