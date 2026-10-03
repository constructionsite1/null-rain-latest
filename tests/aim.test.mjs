import test from 'node:test';
import assert from 'node:assert/strict';
import { AimState } from '../src/aim.js';

test('precision aim alone never fires; primary and aimed sidearm are exclusive',()=>{
  const a=new AimState();a.right=true;
  assert.deepEqual(a.buttons('ghost'),{attack:false,secondary:false,aiming:true});
  a.left=true;assert.deepEqual(a.buttons('ghost'),{attack:false,secondary:true,aiming:true});
  a.right=false;assert.deepEqual(a.buttons('ghost'),{attack:true,secondary:false,aiming:false});
  a.reset();assert.equal(a.buttons().attack,false);
});

test('Chronoblade right click faces cursor without aim or sidearm fire and consumes one parry edge',()=>{
  const a=new AimState();a.right=true;a.pressGuard();
  assert.deepEqual(a.buttons('blade'),{attack:false,secondary:false,aiming:false,faceCursor:true});
  assert.equal(a.consumeGuard(),true);assert.equal(a.consumeGuard(),false);
  a.left=true;assert.equal(a.buttons('blade').attack,true);assert.equal(a.buttons('blade').secondary,false);
  a.pressGuard();a.reset();assert.equal(a.consumeGuard(),false);
});
test('captured cursor moves freely in screen space and translates with the camera',()=>{
  const a=new AimState();assert.equal(a.world({x:100,y:200}),null);
  a.place(500,300,1440,810);a.move(-130,45,1440,810);
  assert.deepEqual(a.world({x:2200,y:1400}),{x:2570,y:1745});
  assert.deepEqual(a.world({x:2250,y:1450}),{x:2620,y:1795});
  a.move(-5000,5000,1440,810);assert.equal(a.x,12);assert.equal(a.y,798);
});
