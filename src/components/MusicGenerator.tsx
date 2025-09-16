
import { ProducerLayout } from './layout/ProducerLayout';
import { GeneratedSongsSidebar } from './sidebar/GeneratedSongsSidebar';
import { MainGenerationArea } from './producer/MainGenerationArea';

export const MusicGenerator = () => {
  return (
    <ProducerLayout
      sidebar={<GeneratedSongsSidebar />}
    >
      <MainGenerationArea />
    </ProducerLayout>
  );
};
