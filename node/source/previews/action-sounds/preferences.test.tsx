import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { useRecipeIconView } from '../../src/ui/RecipeViewToggle';

afterEach(()=>vi.unstubAllGlobals());
function View({persist}:{persist?:boolean}) { const {compact}=useRecipeIconView(persist);return <span>{compact?'compact':'details'}</span>; }
it('lets isolated previews avoid reading shared recipe preferences',()=>{
  const getItem=vi.fn(()=>{throw Error('Preview must not read shared preferences');});vi.stubGlobal('localStorage',{getItem});
  expect(renderToStaticMarkup(<View persist={false}/>)).toContain('details');expect(getItem).not.toHaveBeenCalled();
});
it('retains the saved recipe view by default for ordinary game panels',()=>{
  const getItem=vi.fn(()=> 'true');vi.stubGlobal('localStorage',{getItem});
  expect(renderToStaticMarkup(<View/>)).toContain('compact');expect(getItem).toHaveBeenCalledWith('factorinode.recipe-icon-view.v1');
});
