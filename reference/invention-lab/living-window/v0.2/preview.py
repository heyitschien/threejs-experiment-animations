from pathlib import Path
import json, numpy as np, matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from matplotlib.transforms import Affine2D
D=Path(__file__).parent; parts=json.loads((D/'geometry.json').read_text())['parts']
colors={'frame':'#435650','timber':'#b58a5e','glass':'#b7dce0','vent':'#77847b','shade':'#88988a','gasket':'#353f3a','screen':'#a5b8ae'}
fig=plt.figure(figsize=(13,8),facecolor='#f6f5f0'); gs=fig.add_gridspec(2,3,width_ratios=[1,1,1.15],height_ratios=[1,0.7],left=.06,right=.96,bottom=.08,top=.84,wspace=.28,hspace=.35)
fig.text(.06,.94,'LIVING WINDOW / 001',fontsize=25,fontweight='bold',color='#213c34');fig.text(.06,.895,'v0.2  •  Concept geometry  •  All dimensions in mm  •  Not for construction',fontsize=12,color='#54665d')
for idx,(title,inside) in enumerate([('A / EXTERIOR',False),('B / INTERIOR',True)]):
 ax=fig.add_subplot(gs[:,idx]); ax.set_title(title,loc='left',fontweight='bold',fontsize=12)
 for p in sorted(parts,key=lambda p:p['center'][1],reverse=not inside):
  x,y,z=p['center']; w,d,h=p['size']; a=np.deg2rad(p['rotation_x_deg']); hh=abs(h*np.cos(a))+abs(d*np.sin(a));
  if p['material']=='glass': hh=h
  ax.add_patch(Rectangle((x-w/2,z-hh/2),w,hh,fc=colors[p['material']],ec='#53645b',lw=.35,alpha=.85 if p['material']=='glass' else 1))
 ax.annotate('',(0,-70),(1200,-70),arrowprops={'arrowstyle':'<->','color':'#52635a'});ax.text(600,-133,'1200',ha='center',fontsize=11)
 ax.annotate('',(-65,0),(-65,1500),arrowprops={'arrowstyle':'<->','color':'#52635a'});ax.text(-100,750,'1500',rotation=90,va='center',ha='center',fontsize=11)
 ax.set(xlim=(-145,1280),ylim=(-170,1550),aspect='equal');ax.axis('off')
ax=fig.add_subplot(gs[0,2]);ax.set_title('C / LOWER VENT SECTION',loc='left',fontweight='bold',fontsize=12)
for p in parts:
 x,y,z=p['center'];w,d,h=p['size'];
 if p['name'].startswith('lower_') and (x-w/2<600<x+w/2) and z<180:
  ax.add_patch(Rectangle((y-d/2,z-h/2-60),d,h,fc=colors[p['material']],ec='#435650',lw=.5))
ax.plot([-85,-36,-30,-30,-10,5,5,27,60],[35,35,35,83,83,83,45,45,45],alpha=0) # actual path below
ax.plot([-80,-40,-30,-30,-10,0,8,25,27,60],[35,35,35,76,76,76,50,50,85,85],color='#237b9a',lw=1.8,ls='--');ax.annotate('',(66,85),(55,85),arrowprops={'arrowstyle':'->','color':'#237b9a','lw':2})
ax.set(xlim=(-90,75),ylim=(-5,125),aspect='equal');ax.set_xlabel('outside  ←  depth  →  inside',fontsize=9);ax.set_ylabel('height',fontsize=9);ax.spines[['right','top']].set_visible(False);ax.tick_params(labelsize=8)
ax=fig.add_subplot(gs[1,2]);ax.axis('off');ax.text(0,1,'D / KEY DIMENSIONS',fontsize=12,fontweight='bold',va='top');ax.text(0,.8,'Frame: 1200 × 1500 × 100\nVent bands: 120 high each\nSlots: 800 × 20 each face\nGlazing envelope: 1080 × 1060 × 24\n13 external shading slats\n',fontsize=10.5,va='top',linespacing=1.5);ax.text(0,.08,'Air path is illustrative, not CFD.\nDrainage, seals and hardware unresolved.',fontsize=9,color='#6b5040',va='top')
fig.savefig(D/'concept_board.png',dpi=180,bbox_inches='tight',facecolor=fig.get_facecolor());plt.close(fig)
